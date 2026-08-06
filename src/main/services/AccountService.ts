import { getPrismaClient } from '../database/client'
import { wrapService } from '../lib/wrapService'
import { createAccountSchema, updateAccountSchema, validateDto } from '../../shared/validation'
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

async function computeBalance(accountId: number, initialBalance: number): Promise<number> {
  const income = await db().transaction.aggregate({
    where: { accountId, type: { in: ['INCOME', 'TRANSFER_IN'] } },
    _sum: { amount: true }
  })
  const expense = await db().transaction.aggregate({
    where: { accountId, type: { in: ['EXPENSE', 'TRANSFER_OUT'] } },
    _sum: { amount: true }
  })
  return initialBalance + (income._sum.amount ?? 0) - (expense._sum.amount ?? 0)
}

export const AccountService = {
  async getAll(): Promise<ApiResult<Account[]>> {
    return wrapService(async () => {
      const accounts = await db().account.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' }
      })

      return Promise.all(
        accounts.map(async (acc) => mapAccount(acc, await computeBalance(acc.id, acc.initialBalance)))
      )
    })
  },

  async getById(id: number): Promise<ApiResult<Account>> {
    return wrapService(async () => {
      const acc = await db().account.findUnique({ where: { id } })
      if (!acc) throw new Error('Cuenta no encontrada')

      const currentBalance = await computeBalance(id, acc.initialBalance)
      return mapAccount(acc, currentBalance)
    })
  },

  async create(dto: CreateAccountDto): Promise<ApiResult<Account>> {
    return wrapService(async () => {
      const data = validateDto(createAccountSchema, dto)
      const account = await db().account.create({ data })
      return mapAccount(account, account.initialBalance)
    })
  },

  async update(id: number, dto: UpdateAccountDto): Promise<ApiResult<Account>> {
    return wrapService(async () => {
      const data = validateDto(updateAccountSchema, dto)
      const account = await db().account.update({ where: { id }, data })
      return mapAccount(account)
    })
  },

  async delete(id: number): Promise<ApiResult<void>> {
    return wrapService(async () => {
      const txCount = await db().transaction.count({ where: { accountId: id } })
      if (txCount > 0) {
        // Soft delete: marcar como inactiva
        await db().account.update({ where: { id }, data: { isActive: false } })
      } else {
        await db().account.delete({ where: { id } })
      }
    })
  },

  async getTotalBalance(): Promise<ApiResult<number>> {
    return wrapService(async () => {
      const accounts = await db().account.findMany({ where: { isActive: true } })
      let total = 0
      for (const acc of accounts) {
        total += await computeBalance(acc.id, acc.initialBalance)
      }
      return total
    })
  },

  async hasTransactions(id: number): Promise<ApiResult<boolean>> {
    return wrapService(async () => {
      const count = await db().transaction.count({ where: { accountId: id } })
      return count > 0
    })
  }
}
