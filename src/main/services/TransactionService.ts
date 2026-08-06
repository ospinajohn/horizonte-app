import { getPrismaClient } from '../database/client'
import { wrapService } from '../lib/wrapService'
import { createTransactionSchema, updateTransactionSchema, validateDto } from '../../shared/validation'
import type {
  Transaction,
  CreateTransactionDto,
  TransactionFilters,
  PaginatedResult,
  ApiResult
} from '../../shared/types'

const db = () => getPrismaClient()

function mapTransaction(raw: any): Transaction {
  return {
    ...raw,
    tags: raw.tags ? JSON.parse(raw.tags) : null
  }
}

export const TransactionService = {
  async getAll(filters: TransactionFilters = {}): Promise<ApiResult<PaginatedResult<Transaction>>> {
    return wrapService(async () => {
      const {
        type,
        accountId,
        categoryId,
        from,
        to,
        search,
        tags,
        paymentMethod,
        page = 1,
        pageSize = 50
      } = filters

      const where: any = {}
      if (type) where.type = type
      if (accountId) where.accountId = accountId
      if (categoryId) where.categoryId = categoryId
      if (paymentMethod) where.paymentMethod = paymentMethod
      if (from || to) {
        where.date = {}
        if (from) where.date.gte = from
        if (to) where.date.lte = to
      }
      if (search) {
        where.description = { contains: search }
      }
      if (tags && tags.length > 0) {
        // Búsqueda por tags (JSON string)
        where.tags = { contains: tags[0] }
      }

      const [total, items] = await Promise.all([
        db().transaction.count({ where }),
        db().transaction.findMany({
          where,
          include: {
            account: true,
            category: true
          },
          orderBy: { date: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize
        })
      ])

      return {
        items: items.map(mapTransaction),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    })
  },

  async getById(id: number): Promise<ApiResult<Transaction>> {
    return wrapService(async () => {
      const tx = await db().transaction.findUnique({
        where: { id },
        include: { account: true, category: true }
      })
      if (!tx) throw new Error('Transacción no encontrada')
      return mapTransaction(tx)
    })
  },

  async create(dto: CreateTransactionDto): Promise<ApiResult<Transaction>> {
    return wrapService(async () => {
      const data = validateDto(createTransactionSchema, dto)
      const tx = await db().transaction.create({
        data: {
          ...data,
          tags: data.tags ? JSON.stringify(data.tags) : null
        },
        include: { account: true, category: true }
      })
      return mapTransaction(tx)
    })
  },

  async update(
    id: number,
    dto: Partial<CreateTransactionDto>
  ): Promise<ApiResult<Transaction>> {
    return wrapService(async () => {
      const data = validateDto(updateTransactionSchema, dto)
      const tx = await db().transaction.update({
        where: { id },
        data: {
          ...data,
          tags: data.tags ? JSON.stringify(data.tags) : undefined
        },
        include: { account: true, category: true }
      })
      return mapTransaction(tx)
    })
  },

  async delete(id: number): Promise<ApiResult<void>> {
    return wrapService(async () => {
      await db().transaction.delete({ where: { id } })
    })
  },

  async getMonthSummary(year: number, month: number): Promise<ApiResult<{
    income: number
    expense: number
    balance: number
  }>> {
    return wrapService(async () => {
      const start = new Date(year, month - 1, 1)
      const end = new Date(year, month, 0, 23, 59, 59)

      const [incomeAgg, expenseAgg] = await Promise.all([
        db().transaction.aggregate({
          where: { type: 'INCOME', date: { gte: start, lte: end } },
          _sum: { amount: true }
        }),
        db().transaction.aggregate({
          where: { type: 'EXPENSE', date: { gte: start, lte: end } },
          _sum: { amount: true }
        })
      ])

      const income = incomeAgg._sum.amount ?? 0
      const expense = expenseAgg._sum.amount ?? 0
      return { income, expense, balance: income - expense }
    })
  },

  async getExpensesByCategory(
    from: Date,
    to: Date
  ): Promise<ApiResult<Array<{ categoryId: number; categoryName: string; color: string; amount: number }>>> {
    return wrapService(async () => {
      const grouped = await db().transaction.groupBy({
        by: ['categoryId'],
        where: { type: 'EXPENSE', date: { gte: from, lte: to }, categoryId: { not: null } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } }
      })

      return Promise.all(
        grouped.map(async (g) => {
          const cat = g.categoryId
            ? await db().category.findUnique({ where: { id: g.categoryId } })
            : null
          return {
            categoryId: g.categoryId ?? 0,
            categoryName: cat?.name ?? 'Sin categoría',
            color: cat?.color ?? '#6b7280',
            amount: g._sum.amount ?? 0
          }
        })
      )
    })
  },

  async getCashflowLast30Days(): Promise<ApiResult<Array<{
    date: string
    income: number
    expense: number
    balance: number
  }>>> {
    return wrapService(async () => {
      const today = new Date()
      const from = new Date(today)
      from.setDate(from.getDate() - 29)
      from.setHours(0, 0, 0, 0)

      const transactions = await db().transaction.findMany({
        where: {
          type: { in: ['INCOME', 'EXPENSE'] },
          date: { gte: from, lte: today }
        },
        select: { type: true, amount: true, date: true },
        orderBy: { date: 'asc' }
      })

      // Agrupar por día
      const byDay = new Map<string, { income: number; expense: number }>()
      for (let i = 0; i < 30; i++) {
        const d = new Date(from)
        d.setDate(d.getDate() + i)
        const key = d.toISOString().split('T')[0]
        byDay.set(key, { income: 0, expense: 0 })
      }

      for (const tx of transactions) {
        const key = new Date(tx.date).toISOString().split('T')[0]
        const day = byDay.get(key)
        if (day) {
          if (tx.type === 'INCOME') day.income += tx.amount
          else day.expense += tx.amount
        }
      }

      let runningBalance = 0
      return Array.from(byDay.entries()).map(([date, { income, expense }]) => {
        runningBalance += income - expense
        return { date, income, expense, balance: runningBalance }
      })
    })
  }
}
