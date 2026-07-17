import { getPrismaClient } from '../database/client'
import type { Transfer, CreateTransferDto, ApiResult } from '../../shared/types'

const db = () => getPrismaClient()

export const TransferService = {
  async getAll(): Promise<ApiResult<Transfer[]>> {
    try {
      const transfers = await db().transfer.findMany({
        include: { fromAccount: true, toAccount: true },
        orderBy: { date: 'desc' }
      })
      return { success: true, data: transfers as Transfer[] }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  async create(dto: CreateTransferDto): Promise<ApiResult<Transfer>> {
    try {
      // Verificar saldo suficiente
      const fromAccount = await db().account.findUnique({ where: { id: dto.fromAccountId } })
      if (!fromAccount) return { success: false, error: 'Cuenta origen no encontrada' }

      // Calcular saldo actual de la cuenta origen
      const income = await db().transaction.aggregate({
        where: { accountId: dto.fromAccountId, type: { in: ['INCOME', 'TRANSFER_IN'] } },
        _sum: { amount: true }
      })
      const expense = await db().transaction.aggregate({
        where: { accountId: dto.fromAccountId, type: { in: ['EXPENSE', 'TRANSFER_OUT'] } },
        _sum: { amount: true }
      })
      const currentBalance =
        fromAccount.initialBalance + (income._sum.amount ?? 0) - (expense._sum.amount ?? 0)

      if (currentBalance < dto.amount) {
        return { success: false, error: 'Saldo insuficiente en la cuenta origen' }
      }

      // Crear transferencia + 2 transacciones atómicamente
      const [transfer] = await db().$transaction(async (tx) => {
        const transfer = await tx.transfer.create({
          data: {
            amount: dto.amount,
            date: dto.date,
            description: dto.description ?? null,
            fromAccountId: dto.fromAccountId,
            toAccountId: dto.toAccountId
          }
        })

        const txOut = await tx.transaction.create({
          data: {
            type: 'TRANSFER_OUT',
            amount: dto.amount,
            date: dto.date,
            description: dto.description ?? `Transferencia a cuenta`,
            accountId: dto.fromAccountId,
            paymentMethod: 'TRANSFER'
          }
        })

        const txIn = await tx.transaction.create({
          data: {
            type: 'TRANSFER_IN',
            amount: dto.amount,
            date: dto.date,
            description: dto.description ?? `Transferencia desde cuenta`,
            accountId: dto.toAccountId,
            linkedTransferId: txOut.id,
            paymentMethod: 'TRANSFER'
          }
        })

        // Actualizar el linkedTransferId del txOut
        await tx.transaction.update({
          where: { id: txOut.id },
          data: { linkedTransferId: txIn.id }
        })

        return [transfer]
      })

      const full = await db().transfer.findUnique({
        where: { id: transfer.id },
        include: { fromAccount: true, toAccount: true }
      })

      return { success: true, data: full as Transfer }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  async delete(id: number): Promise<ApiResult<void>> {
    try {
      await db().transfer.delete({ where: { id } })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}
