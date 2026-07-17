import { getPrismaClient } from '../database/client'
import { AccountService } from './AccountService'
import { TransactionService } from './TransactionService'
import { RecurringService } from './RecurringService'
import { AlertService } from './AlertService'
import type { DashboardData, ApiResult } from '../../shared/types'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

const db = () => getPrismaClient()

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
  }
}
