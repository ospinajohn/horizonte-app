import { getPrismaClient } from '../database/client'
import { wrapService } from '../lib/wrapService'
import { createBudgetSchema, validateDto } from '../../shared/validation'
import type { Budget, BudgetCategory, CreateBudgetDto, ApiResult } from '../../shared/types'

const db = () => getPrismaClient()

export const BudgetService = {
  async getAll(): Promise<ApiResult<Budget[]>> {
    return wrapService(async () => {
      const budgets = await db().budget.findMany({
        include: { categories: { include: { category: true } } },
        orderBy: { startDate: 'desc' }
      })
      return budgets as Budget[]
    })
  },

  async getActive(): Promise<ApiResult<Budget | null>> {
    return wrapService(async () => {
      const today = new Date()
      const budget = await db().budget.findFirst({
        where: {
          isActive: true,
          startDate: { lte: today },
          endDate: { gte: today }
        },
        include: { categories: { include: { category: true } } }
      })
      return budget as Budget | null
    })
  },

  async create(dto: CreateBudgetDto): Promise<ApiResult<Budget>> {
    return wrapService(async () => {
      const data = validateDto(createBudgetSchema, dto)
      const budget = await db().budget.create({
        data: {
          name: data.name,
          period: data.period,
          startDate: data.startDate,
          endDate: data.endDate,
          categories: {
            create: data.categories.map((c) => ({
              categoryId: c.categoryId,
              limit: c.limit
            }))
          }
        },
        include: { categories: { include: { category: true } } }
      })
      return budget as Budget
    })
  },

  async delete(id: number): Promise<ApiResult<void>> {
    return wrapService(async () => {
      await db().budget.update({ where: { id }, data: { isActive: false } })
    })
  },

  /** Calcula el gasto real de cada categoría en el período del presupuesto */
  async getWithSpending(budgetId: number): Promise<ApiResult<Budget & {
    categories: Array<BudgetCategory & { spent: number; remaining: number; percentage: number }>
  }>> {
    return wrapService(async () => {
      const budget = await db().budget.findUnique({
        where: { id: budgetId },
        include: { categories: { include: { category: true } } }
      })
      if (!budget) throw new Error('Presupuesto no encontrado')

      const categoriesWithSpending = await Promise.all(
        budget.categories.map(async (bc) => {
          const agg = await db().transaction.aggregate({
            where: {
              type: 'EXPENSE',
              categoryId: bc.categoryId,
              date: { gte: budget.startDate, lte: budget.endDate }
            },
            _sum: { amount: true }
          })
          const spent = agg._sum.amount ?? 0
          const remaining = Math.max(bc.limit - spent, 0)
          const percentage = bc.limit > 0 ? Math.min((spent / bc.limit) * 100, 100) : 0
          return { ...bc, spent, remaining, percentage }
        })
      )

      return { ...budget, categories: categoriesWithSpending } as any
    })
  },

  /** Presupuesto activo con gasto real incluido */
  async getActiveWithSpending(): Promise<ApiResult<any>> {
    const active = await BudgetService.getActive()
    if (!active.success) return active
    if (!active.data) return { success: true, data: null }
    return BudgetService.getWithSpending(active.data.id)
  }
}
