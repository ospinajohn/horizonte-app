import { getPrismaClient } from '../database/client'
import type {
  Account,
  CreateAccountDto,
  UpdateAccountDto,
  ApiResult
} from '../../shared/types'

const db = () => getPrismaClient()

function mapAccount(raw: any, currentBalance?: number): Account {
  return {
    ...raw,
    type: raw.type as Account['type'],
    currentBalance: currentBalance ?? raw.initialBalance
  }
}

export const AccountService = {
  async getAll(): Promise<ApiResult<Account[]>> {
    try {
      const accounts = await db().account.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' }
      })

      // Calcular saldo actual para cada cuenta
      const withBalances = await Promise.all(
        accounts.map(async (acc) => {
          const income = await db().transaction.aggregate({
            where: { accountId: acc.id, type: { in: ['INCOME', 'TRANSFER_IN'] } },
            _sum: { amount: true }
          })
          const expense = await db().transaction.aggregate({
            where: { accountId: acc.id, type: { in: ['EXPENSE', 'TRANSFER_OUT'] } },
            _sum: { amount: true }
          })

          const currentBalance =
            acc.initialBalance +
            (income._sum.amount ?? 0) -
            (expense._sum.amount ?? 0)

          return mapAccount(acc, currentBalance)
        })
      )

      return { success: true, data: withBalances }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  async getById(id: number): Promise<ApiResult<Account>> {
    try {
      const acc = await db().account.findUnique({ where: { id } })
      if (!acc) return { success: false, error: 'Cuenta no encontrada' }

      const income = await db().transaction.aggregate({
        where: { accountId: id, type: { in: ['INCOME', 'TRANSFER_IN'] } },
        _sum: { amount: true }
      })
      const expense = await db().transaction.aggregate({
        where: { accountId: id, type: { in: ['EXPENSE', 'TRANSFER_OUT'] } },
        _sum: { amount: true }
      })
      const currentBalance =
        acc.initialBalance + (income._sum.amount ?? 0) - (expense._sum.amount ?? 0)

      return { success: true, data: mapAccount(acc, currentBalance) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  async create(dto: CreateAccountDto): Promise<ApiResult<Account>> {
    try {
      const account = await db().account.create({ data: dto })
      return { success: true, data: mapAccount(account, account.initialBalance) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  async update(id: number, dto: UpdateAccountDto): Promise<ApiResult<Account>> {
    try {
      const account = await db().account.update({ where: { id }, data: dto })
      return { success: true, data: mapAccount(account) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  async delete(id: number): Promise<ApiResult<void>> {
    try {
      const txCount = await db().transaction.count({ where: { accountId: id } })
      if (txCount > 0) {
        // Soft delete: marcar como inactiva
        await db().account.update({ where: { id }, data: { isActive: false } })
      } else {
        await db().account.delete({ where: { id } })
      }
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  async getTotalBalance(): Promise<ApiResult<number>> {
    try {
      const accounts = await db().account.findMany({ where: { isActive: true } })
      let total = 0
      for (const acc of accounts) {
        const income = await db().transaction.aggregate({
          where: { accountId: acc.id, type: { in: ['INCOME', 'TRANSFER_IN'] } },
          _sum: { amount: true }
        })
        const expense = await db().transaction.aggregate({
          where: { accountId: acc.id, type: { in: ['EXPENSE', 'TRANSFER_OUT'] } },
          _sum: { amount: true }
        })
        total += acc.initialBalance + (income._sum.amount ?? 0) - (expense._sum.amount ?? 0)
      }
      return { success: true, data: total }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  async hasTransactions(id: number): Promise<ApiResult<boolean>> {
    try {
      const count = await db().transaction.count({ where: { accountId: id } })
      return { success: true, data: count > 0 }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}
