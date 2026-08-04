import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { getPrismaClient } from '../database/client'
import type { AnalyticsData, ApiResult } from '../../shared/types'

const db = () => getPrismaClient()

function getMonthLabel(date: Date): string {
  return format(date, 'MMM yy', { locale: es })
}

export const AnalyticsService = {
  async getData(
    year: number,
    month: number,
    period: 'monthly' | 'quarterly' | 'annual'
  ): Promise<ApiResult<AnalyticsData>> {
    try {
      const prisma = db()
      const now = new Date()

      // Determinar rango del período actual
      let periodStart: Date
      let periodEnd: Date
      let periodLabel: string
      let prevStart: Date
      let prevEnd: Date

      if (period === 'monthly') {
        periodStart = new Date(year, month - 1, 1)
        periodEnd = new Date(year, month, 0, 23, 59, 59)
        periodLabel = format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: es })
        prevStart = new Date(year, month - 2, 1)
        prevEnd = new Date(year, month - 1, 0, 23, 59, 59)
      } else if (period === 'quarterly') {
        const q = Math.floor((month - 1) / 3)
        periodStart = new Date(year, q * 3, 1)
        periodEnd = new Date(year, q * 3 + 3, 0, 23, 59, 59)
        periodLabel = `T${q + 1} ${year}`
        prevStart = new Date(year, (q - 1) * 3, 1)
        prevEnd = new Date(year, q * 3, 0, 23, 59, 59)
      } else {
        periodStart = new Date(year, 0, 1)
        periodEnd = new Date(year, 11, 31, 23, 59, 59)
        periodLabel = `Año ${year}`
        prevStart = new Date(year - 1, 0, 1)
        prevEnd = new Date(year - 1, 11, 31, 23, 59, 59)
      }

      // --- Gastos por categoría ---
      const expensesByCat = await prisma.transaction.groupBy({
        by: ['categoryId'],
        where: { type: 'EXPENSE', date: { gte: periodStart, lte: periodEnd } },
        _sum: { amount: true }
      })

      const categories = await prisma.category.findMany({ where: { isActive: true } })
      const catMap = new Map(categories.map((c) => [c.id, c]))

      const totalExpense = expensesByCat.reduce((s, r) => s + (r._sum.amount ?? 0), 0)

      const expensesByCategory = expensesByCat
        .filter((r) => r.categoryId !== null)
        .map((r) => {
          const cat = r.categoryId ? catMap.get(r.categoryId) : null
          const amount = r._sum.amount ?? 0
          return {
            categoryId: r.categoryId ?? 0,
            categoryName: cat?.name ?? 'Sin categoría',
            color: cat?.color ?? '#6b7280',
            amount: Math.round(amount),
            percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0
          }
        })
        .sort((a, b) => b.amount - a.amount)

      // --- Ingresos totales período ---
      const incomeAgg = await prisma.transaction.aggregate({
        where: { type: 'INCOME', date: { gte: periodStart, lte: periodEnd } },
        _sum: { amount: true }
      })
      const totalIncome = Math.round(incomeAgg._sum.amount ?? 0)
      const totalBalance = totalIncome - Math.round(totalExpense)

      // --- Comparación vs período anterior ---
      const prevIncomeAgg = await prisma.transaction.aggregate({
        where: { type: 'INCOME', date: { gte: prevStart, lte: prevEnd } },
        _sum: { amount: true }
      })
      const prevExpenseAgg = await prisma.transaction.aggregate({
        where: { type: 'EXPENSE', date: { gte: prevStart, lte: prevEnd } },
        _sum: { amount: true }
      })
      const prevIncome = prevIncomeAgg._sum.amount ?? 0
      const prevExpenseTotal = prevExpenseAgg._sum.amount ?? 0

      const incomeChange = prevIncome > 0 ? Math.round(((totalIncome - prevIncome) / prevIncome) * 100) : 0
      const expenseChange = prevExpenseTotal > 0 ? Math.round(((totalExpense - prevExpenseTotal) / prevExpenseTotal) * 100) : 0

      // --- Comparación mensual (últimos 6 meses) ---
      const monthlyComparison: AnalyticsData['monthlyComparison'] = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const mStart = new Date(d.getFullYear(), d.getMonth(), 1)
        const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)

        const inc = await prisma.transaction.aggregate({
          where: { type: 'INCOME', date: { gte: mStart, lte: mEnd } },
          _sum: { amount: true }
        })
        const exp = await prisma.transaction.aggregate({
          where: { type: 'EXPENSE', date: { gte: mStart, lte: mEnd } },
          _sum: { amount: true }
        })
        const inc_ = Math.round(inc._sum.amount ?? 0)
        const exp_ = Math.round(exp._sum.amount ?? 0)
        monthlyComparison.push({
          month: getMonthLabel(d),
          income: inc_,
          expense: exp_,
          balance: inc_ - exp_
        })
      }

      // --- Evolución del ahorro (contribuciones a metas, últimos 6 meses) ---
      const savingsEvolution: AnalyticsData['savingsEvolution'] = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const mStart = new Date(d.getFullYear(), d.getMonth(), 1)
        const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)

        const contribAgg = await prisma.savingsContribution.aggregate({
          where: { date: { gte: mStart, lte: mEnd } },
          _sum: { amount: true }
        })
        savingsEvolution.push({
          month: getMonthLabel(d),
          totalSaved: Math.round(contribAgg._sum.amount ?? 0)
        })
      }

      // --- Flujo de caja por mes ---
      const cashflowByMonth = monthlyComparison.map((m) => ({
        month: m.month,
        income: m.income,
        expense: m.expense
      }))

      // --- Insights automáticos (máx 5) ---
      const insights: AnalyticsData['insights'] = []

      // Insight 1: Categoría que domina el gasto
      if (expensesByCategory.length > 0 && expensesByCategory[0].percentage >= 30) {
        const top = expensesByCategory[0]
        insights.push({
          type: 'warning',
          message: `${top.categoryName} representa el ${top.percentage}% de tus gastos — considera reducir este gasto`
        })
      }

      // Insight 2: Gastos del mes aumentaron más de 20%
      if (expenseChange > 20) {
        insights.push({
          type: 'warning',
          message: `Tus gastos aumentaron un ${expenseChange}% comparado con el período anterior`
        })
      }

      // Insight 3: Ahorro positivo
      if (totalBalance > 0) {
        const savingRate = totalIncome > 0 ? Math.round((totalBalance / totalIncome) * 100) : 0
        insights.push({
          type: 'positive',
          message: `Ahorraste $${totalBalance.toLocaleString()} este período — ${savingRate}% de tus ingresos`
        })
      }

      // Insight 4: Verificar si hay meses sin presupuesto activo
      const activeBudgets = await prisma.budget.count({
        where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } }
      })
      if (activeBudgets === 0) {
        insights.push({
          type: 'info',
          message: 'No tienes un presupuesto activo — configura uno para un mejor control financiero'
        })
      }

      // Insight 5: Balance positivo 3 meses seguidos
      const last3 = monthlyComparison.slice(-3)
      if (last3.length === 3 && last3.every((m) => m.balance > 0)) {
        insights.push({
          type: 'positive',
          message: 'Llevas 3 meses consecutivos con balance positivo — ¡excelente gestión!'
        })
      }

      return {
        success: true,
        data: {
          expensesByCategory,
          monthlyComparison,
          savingsEvolution,
          cashflowByMonth,
          insights: insights.slice(0, 5),
          periodLabel,
          totalIncome,
          totalExpense: Math.round(totalExpense),
          totalBalance,
          vsLastPeriod: { incomeChange, expenseChange }
        }
      }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }
}
