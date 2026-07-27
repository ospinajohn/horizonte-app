import { getPrismaClient } from '../database/client'
import { AccountService } from './AccountService'
import { TransactionService } from './TransactionService'
import { RecurringService } from './RecurringService'
import { AlertService } from './AlertService'
import { wrapService } from '../lib/wrapService'
import type { DashboardData, ApiResult, BiweeklyData, Quincena } from '../../shared/types'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

const db = () => getPrismaClient()

function getQuincenaRange(year: number, month: number, quincena: Quincena): { start: Date; end: Date } {
  if (quincena === 'Q1') {
    return { start: new Date(year, month - 1, 1), end: new Date(year, month - 1, 15, 23, 59, 59, 999) }
  }
  const lastDay = new Date(year, month, 0).getDate()
  return { start: new Date(year, month - 1, 16), end: new Date(year, month - 1, lastDay, 23, 59, 59, 999) }
}

export const DashboardService = {
  async getData(): Promise<ApiResult<DashboardData>> {
    try {
      const today = new Date()
      const monthStart = startOfMonth(today)
      const monthEnd = endOfMonth(today)
      const prevMonthStart = startOfMonth(subMonths(today, 1))
      const prevMonthEnd = endOfMonth(subMonths(today, 1))

      // Cargar todo en paralelo
      const [
        totalBalanceResult,
        currentMonthSummary,
        prevMonthSummary,
        upcomingResult,
        expByCatResult,
        cashflowResult,
        unreadAlertsResult,
        goalsRaw
      ] = await Promise.all([
        AccountService.getTotalBalance(),
        TransactionService.getMonthSummary(today.getFullYear(), today.getMonth() + 1),
        TransactionService.getMonthSummary(
          prevMonthStart.getFullYear(),
          prevMonthStart.getMonth() + 1
        ),
        RecurringService.getUpcoming(7),
        TransactionService.getExpensesByCategory(monthStart, monthEnd),
        TransactionService.getCashflowLast30Days(),
        AlertService.getUnreadCount(),
        db().savingsGoal.findMany({
          where: { isActive: true, isCompleted: false },
          orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
          take: 3,
          include: { account: true }
        })
      ])

      const data: DashboardData = {
        totalBalance: totalBalanceResult.data ?? 0,
        monthIncome: currentMonthSummary.data?.income ?? 0,
        monthExpense: currentMonthSummary.data?.expense ?? 0,
        monthBalance: currentMonthSummary.data?.balance ?? 0,
        prevMonthIncome: prevMonthSummary.data?.income ?? 0,
        prevMonthExpense: prevMonthSummary.data?.expense ?? 0,
        upcomingPayments: upcomingResult.data ?? [],
        topGoals: goalsRaw as any[],
        expensesByCategory: expByCatResult.data ?? [],
        cashflowChart: cashflowResult.data ?? [],
        unreadAlerts: unreadAlertsResult.data ?? 0
      }

      return { success: true, data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  async getBiweeklyData(year: number, month: number, quincena: Quincena): Promise<ApiResult<BiweeklyData>> {
    return wrapService(async () => {
      const { start, end } = getQuincenaRange(year, month, quincena)

      const [incomeAgg, expenseAgg, committedItems] = await Promise.all([
        db().transaction.aggregate({
          where: { type: 'INCOME', date: { gte: start, lte: end } },
          _sum: { amount: true }
        }),
        db().transaction.aggregate({
          where: { type: 'EXPENSE', date: { gte: start, lte: end } },
          _sum: { amount: true }
        }),
        db().recurringItem.findMany({
          where: { isActive: true, nextDate: { gte: start, lte: end } },
          include: { category: true },
          orderBy: { nextDate: 'asc' }
        })
      ])

      const income = incomeAgg._sum.amount ?? 0
      const spent = expenseAgg._sum.amount ?? 0
      const committed = committedItems
        .filter((i) => i.type === 'EXPENSE' || i.type === 'PAYMENT')
        .reduce((acc, i) => acc + i.amount, 0)

      return {
        year,
        month,
        quincena,
        rangeStart: start,
        rangeEnd: end,
        income,
        committed,
        spent,
        available: income - committed - spent,
        committedItems: committedItems.filter((i) => i.type === 'EXPENSE' || i.type === 'PAYMENT') as any
      }
    })
  }
}
