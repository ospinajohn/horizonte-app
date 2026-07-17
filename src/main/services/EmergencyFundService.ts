import { getPrismaClient } from '../database/client'
import type { EmergencyFundData, ApiResult } from '../../shared/types'

const db = () => getPrismaClient()

export const EmergencyFundService = {
  async getData(): Promise<ApiResult<EmergencyFundData>> {
    try {
      const prisma = db()

      // Gastos promedio de los últimos 3 meses
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

      const expenseAgg = await prisma.transaction.aggregate({
        where: { type: 'EXPENSE', date: { gte: threeMonthsAgo } },
        _sum: { amount: true }
      })
      const monthlyExpenseAvg = (expenseAgg._sum.amount ?? 0) / 3

      // Cuentas de emergencia
      const emergencyAccounts = await prisma.account.findMany({
        where: { isEmergencyFund: true, isActive: true }
      })

      // Calcular saldo actual de cada cuenta de emergencia
      const accountsWithBalance = await Promise.all(
        emergencyAccounts.map(async (account) => {
          const txs = await prisma.transaction.findMany({
            where: { accountId: account.id },
            select: { type: true, amount: true }
          })
          const balance = account.initialBalance + txs.reduce((sum, t) => {
            if (t.type === 'INCOME' || t.type === 'TRANSFER_IN') return sum + t.amount
            return sum - t.amount
          }, 0)
          return { ...account, currentBalance: balance }
        })
      )

      const emergencyFundBalance = accountsWithBalance.reduce(
        (sum, a) => sum + (a.currentBalance ?? 0),
        0
      )

      const targetMonths = 6
      const monthsCovered = monthlyExpenseAvg > 0
        ? emergencyFundBalance / monthlyExpenseAvg
        : 0

      const targetAmount = monthlyExpenseAvg * targetMonths
      const missingAmount = Math.max(targetAmount - emergencyFundBalance, 0)
      const monthlyContributionNeeded = missingAmount > 0 ? missingAmount / 12 : 0

      return {
        success: true,
        data: {
          monthlyExpenseAvg: Math.round(monthlyExpenseAvg),
          emergencyFundBalance: Math.round(emergencyFundBalance),
          monthsCovered: Math.round(monthsCovered * 10) / 10,
          targetMonths,
          targetAmount: Math.round(targetAmount),
          missingAmount: Math.round(missingAmount),
          monthlyContributionNeeded: Math.round(monthlyContributionNeeded),
          emergencyAccounts: accountsWithBalance as any
        }
      }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }
}
