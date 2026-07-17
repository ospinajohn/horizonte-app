import { getPrismaClient } from '../database/client'
import { DebtCapacityService } from './DebtCapacityService'
import { EmergencyFundService } from './EmergencyFundService'
import { BudgetService } from './BudgetService'
import type { HealthScoreData, HealthFactors, ApiResult } from '../../shared/types'

const db = () => getPrismaClient()

const WEIGHTS: Record<keyof HealthFactors, number> = {
  liquidityScore: 0.15,
  savingsScore: 0.20,
  debtScore: 0.20,
  patrimonyScore: 0.10,
  budgetScore: 0.15,
  emergencyFundScore: 0.10,
  trendScore: 0.05,
  diversificationScore: 0.05
}

const FACTOR_LABELS: Record<keyof HealthFactors, string> = {
  liquidityScore: 'Liquidez',
  savingsScore: 'Ahorro',
  debtScore: 'Endeudamiento',
  patrimonyScore: 'Patrimonio',
  budgetScore: 'Presupuesto',
  emergencyFundScore: 'Fondo de Emergencia',
  trendScore: 'Tendencia',
  diversificationScore: 'Diversificación'
}

export const HealthScoreService = {
  async calculateScore(): Promise<ApiResult<HealthScoreData>> {
    try {
      const prisma = db()
      const now = new Date()
      const threeMonthsAgo = new Date(now)
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      const oneMonthAgo = new Date(now)
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
      const twoMonthsAgo = new Date(now)
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

      // --- Factor 1: Liquidez (15%) ---
      // Balance total de todas las cuentas activas
      const accounts = await prisma.account.findMany({ where: { isActive: true } })
      let totalBalance = 0
      let accountTypes = new Set<string>()
      for (const acc of accounts) {
        accountTypes.add(acc.type)
        const income = await prisma.transaction.aggregate({
          where: { accountId: acc.id, type: { in: ['INCOME', 'TRANSFER_IN'] } },
          _sum: { amount: true }
        })
        const expense = await prisma.transaction.aggregate({
          where: { accountId: acc.id, type: { in: ['EXPENSE', 'TRANSFER_OUT'] } },
          _sum: { amount: true }
        })
        totalBalance += acc.initialBalance + (income._sum.amount ?? 0) - (expense._sum.amount ?? 0)
      }

      // Gasto mensual promedio últimos 3 meses
      const expAgg = await prisma.transaction.aggregate({
        where: { type: 'EXPENSE', date: { gte: threeMonthsAgo } },
        _sum: { amount: true }
      })
      const monthlyExpenseAvg = (expAgg._sum.amount ?? 0) / 3
      const liquidityMonths = monthlyExpenseAvg > 0 ? totalBalance / monthlyExpenseAvg : 0

      let liquidityScore = 0
      if (liquidityMonths >= 3) liquidityScore = 100
      else if (liquidityMonths >= 2) liquidityScore = 75
      else if (liquidityMonths >= 1) liquidityScore = 50
      else if (liquidityMonths >= 0.5) liquidityScore = 25
      else liquidityScore = 0

      const liquidityDesc = `${liquidityMonths.toFixed(1)} meses de gastos cubiertos con liquidez actual`

      // --- Factor 2: Ahorro (20%) ---
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const incomeAgg = await prisma.transaction.aggregate({
        where: { type: 'INCOME', date: { gte: startOfMonth } },
        _sum: { amount: true }
      })
      const expenseAgg = await prisma.transaction.aggregate({
        where: { type: 'EXPENSE', date: { gte: startOfMonth } },
        _sum: { amount: true }
      })
      const monthIncome = incomeAgg._sum.amount ?? 0
      const monthExpense = expenseAgg._sum.amount ?? 0
      const monthSaving = monthIncome - monthExpense
      const savingRate = monthIncome > 0 ? (monthSaving / monthIncome) * 100 : 0

      let savingsScore = 0
      if (savingRate >= 20) savingsScore = 100
      else if (savingRate >= 10) savingsScore = 75
      else if (savingRate >= 5) savingsScore = 50
      else if (savingRate >= 0) savingsScore = 25
      else savingsScore = 0

      const savingsDesc = `Tasa de ahorro del ${savingRate.toFixed(1)}% este mes`

      // --- Factor 3: Endeudamiento (20%) ---
      const debtResult = await DebtCapacityService.getData()
      const debtRatio = debtResult.success && debtResult.data ? debtResult.data.debtRatioPercent : 0

      let debtScore = 0
      if (debtRatio <= 20) debtScore = 100
      else if (debtRatio <= 30) debtScore = 75
      else if (debtRatio <= 40) debtScore = 50
      else if (debtRatio <= 50) debtScore = 25
      else debtScore = 0

      const debtDesc = `Ratio de endeudamiento del ${debtRatio.toFixed(1)}% de los ingresos`

      // --- Factor 4: Patrimonio (10%) ---
      const latestSnapshot = await prisma.patrimonySnapshot.findFirst({
        orderBy: { snapshotDate: 'desc' }
      })
      const threeMonthsAgoSnapshot = await prisma.patrimonySnapshot.findFirst({
        where: { snapshotDate: { lte: threeMonthsAgo } },
        orderBy: { snapshotDate: 'desc' }
      })

      let patrimonyScore = 0
      let patrimonyDesc = 'Sin datos de patrimonio registrados'
      if (latestSnapshot) {
        if (latestSnapshot.netWorth > 0) {
          if (threeMonthsAgoSnapshot && latestSnapshot.netWorth > threeMonthsAgoSnapshot.netWorth) {
            patrimonyScore = 100
            patrimonyDesc = `Patrimonio positivo y en crecimiento: $${Math.round(latestSnapshot.netWorth).toLocaleString()}`
          } else {
            patrimonyScore = 60
            patrimonyDesc = `Patrimonio positivo sin crecimiento reciente: $${Math.round(latestSnapshot.netWorth).toLocaleString()}`
          }
        } else if (latestSnapshot.netWorth === 0) {
          patrimonyScore = 30
          patrimonyDesc = 'Patrimonio neto en cero'
        } else {
          patrimonyScore = 0
          patrimonyDesc = `Patrimonio neto negativo: $${Math.round(latestSnapshot.netWorth).toLocaleString()}`
        }
      } else {
        patrimonyScore = 50
        patrimonyDesc = 'Sin datos de patrimonio — valor neutral'
      }

      // --- Factor 5: Presupuesto (15%) ---
      const budgetResult = await BudgetService.getActiveWithSpending()
      let budgetScore = 50
      let budgetDesc = 'Sin presupuesto activo — valor neutral'
      if (budgetResult.success && budgetResult.data) {
        const budget = budgetResult.data
        const totalLimit = budget.categories.reduce((s: number, c: any) => s + c.limit, 0)
        const totalSpent = budget.categories.reduce((s: number, c: any) => s + c.spent, 0)
        if (totalLimit > 0) {
          const ratio = totalSpent / totalLimit
          if (ratio <= 0.70) { budgetScore = 100; budgetDesc = `Presupuesto al ${(ratio * 100).toFixed(0)}% — excelente control` }
          else if (ratio <= 0.90) { budgetScore = 70; budgetDesc = `Presupuesto al ${(ratio * 100).toFixed(0)}% — en alerta` }
          else if (ratio <= 1.00) { budgetScore = 40; budgetDesc = `Presupuesto al ${(ratio * 100).toFixed(0)}% — al límite` }
          else { budgetScore = 0; budgetDesc = `Presupuesto excedido: ${(ratio * 100).toFixed(0)}%` }
        }
      }

      // --- Factor 6: Fondo de Emergencia (10%) ---
      const efResult = await EmergencyFundService.getData()
      let emergencyFundScore = 0
      let emergencyDesc = 'Sin fondo de emergencia configurado'
      if (efResult.success && efResult.data) {
        const months = efResult.data.monthsCovered
        if (months >= 6) { emergencyFundScore = 100; emergencyDesc = `Fondo de emergencia completo: ${months.toFixed(1)} meses cubiertos` }
        else if (months >= 3) { emergencyFundScore = 60; emergencyDesc = `Fondo de emergencia parcial: ${months.toFixed(1)} meses cubiertos` }
        else if (months >= 1) { emergencyFundScore = 30; emergencyDesc = `Fondo de emergencia bajo: ${months.toFixed(1)} meses cubiertos` }
        else { emergencyFundScore = 0; emergencyDesc = `Fondo de emergencia insuficiente: ${months.toFixed(1)} meses` }
      }

      // --- Factor 7: Tendencia (5%) ---
      // Comparar balance mes actual vs mes anterior
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
      const prevIncomeAgg = await prisma.transaction.aggregate({
        where: { type: 'INCOME', date: { gte: prevMonthStart, lte: prevMonthEnd } },
        _sum: { amount: true }
      })
      const prevExpenseAgg = await prisma.transaction.aggregate({
        where: { type: 'EXPENSE', date: { gte: prevMonthStart, lte: prevMonthEnd } },
        _sum: { amount: true }
      })
      const prevBalance = (prevIncomeAgg._sum.amount ?? 0) - (prevExpenseAgg._sum.amount ?? 0)
      const currBalance = monthIncome - monthExpense

      let trendScore = 60
      let trendDesc = 'Tendencia estable'
      if (prevBalance !== 0) {
        const trendChange = ((currBalance - prevBalance) / Math.abs(prevBalance)) * 100
        if (trendChange > 5) { trendScore = 100; trendDesc = `Mejorando: balance ${trendChange.toFixed(0)}% mejor que el mes anterior` }
        else if (trendChange >= -5) { trendScore = 60; trendDesc = 'Tendencia estable respecto al mes anterior' }
        else { trendScore = 20; trendDesc = `Deteriorando: balance ${Math.abs(trendChange).toFixed(0)}% peor que el mes anterior` }
      }

      // --- Factor 8: Diversificación (5%) ---
      const numTypes = accountTypes.size
      let diversificationScore = 30
      let diversDesc = ''
      if (numTypes >= 3) { diversificationScore = 100; diversDesc = `${numTypes} tipos de cuenta distintos — bien diversificado` }
      else if (numTypes === 2) { diversificationScore = 60; diversDesc = '2 tipos de cuenta — diversificación media' }
      else { diversificationScore = 30; diversDesc = '1 tipo de cuenta — considera diversificar' }

      const factors: HealthFactors = {
        liquidityScore: Math.round(liquidityScore),
        savingsScore: Math.round(savingsScore),
        debtScore: Math.round(debtScore),
        patrimonyScore: Math.round(patrimonyScore),
        budgetScore: Math.round(budgetScore),
        emergencyFundScore: Math.round(emergencyFundScore),
        trendScore: Math.round(trendScore),
        diversificationScore: Math.round(diversificationScore)
      }

      // Score final ponderado
      const score = Math.round(
        Object.entries(factors).reduce((sum, [key, value]) => {
          return sum + value * WEIGHTS[key as keyof HealthFactors]
        }, 0)
      )

      // Detalles de factores
      const descriptions: Record<keyof HealthFactors, string> = {
        liquidityScore: liquidityDesc,
        savingsScore: savingsDesc,
        debtScore: debtDesc,
        patrimonyScore: patrimonyDesc,
        budgetScore: budgetDesc,
        emergencyFundScore: emergencyDesc,
        trendScore: trendDesc,
        diversificationScore: diversDesc
      }

      const factorDetails = (Object.keys(factors) as (keyof HealthFactors)[]).map((key) => {
        const s = factors[key]
        return {
          key,
          label: FACTOR_LABELS[key],
          score: s,
          weight: Math.round(WEIGHTS[key] * 100),
          description: descriptions[key],
          status: (s >= 70 ? 'good' : s >= 40 ? 'warning' : 'danger') as 'good' | 'warning' | 'danger'
        }
      })

      // Top 3 recomendaciones para los factores con menor score
      const sortedFactors = [...factorDetails].sort((a, b) => a.score - b.score)
      const recommendations: string[] = []
      for (const f of sortedFactors.slice(0, 3)) {
        if (f.key === 'liquidityScore' && f.score < 70)
          recommendations.push('Aumenta tu liquidez — intenta mantener al menos 3 meses de gastos en efectivo')
        else if (f.key === 'savingsScore' && f.score < 70)
          recommendations.push('Mejora tu tasa de ahorro — apunta al 20% de tus ingresos mensuales')
        else if (f.key === 'debtScore' && f.score < 70)
          recommendations.push('Reduce tus compromisos de deuda — el ratio ideal es menor al 30% de tus ingresos')
        else if (f.key === 'patrimonyScore' && f.score < 70)
          recommendations.push('Incrementa tu patrimonio — registra tus activos y trabaja en aumentar tu valor neto')
        else if (f.key === 'budgetScore' && f.score < 70)
          recommendations.push('Controla mejor tu presupuesto — revisa las categorías donde más gastas')
        else if (f.key === 'emergencyFundScore' && f.score < 70)
          recommendations.push('Construye tu fondo de emergencia — apunta a 6 meses de gastos como reserva')
        else if (f.key === 'trendScore' && f.score < 70)
          recommendations.push('Tu tendencia financiera está bajando — revisa tus gastos del último mes')
        else if (f.key === 'diversificationScore' && f.score < 70)
          recommendations.push('Diversifica tus cuentas — considera tener cuenta de ahorro, corriente y de emergencia')
      }

      // Historial de snapshots
      const snapshots = await prisma.healthSnapshot.findMany({
        orderBy: { snapshotDate: 'desc' },
        take: 6
      })
      const history = snapshots.map((s) => ({ snapshotDate: s.snapshotDate, score: s.score }))

      return {
        success: true,
        data: { score, factors, factorDetails, recommendations, history }
      }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async saveSnapshot(): Promise<ApiResult<void>> {
    try {
      const prisma = db()
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      // Verificar si ya existe snapshot del mes actual
      const existing = await prisma.healthSnapshot.findFirst({
        where: { snapshotDate: { gte: startOfMonth, lte: endOfMonth } }
      })
      if (existing) return { success: true } // Ya existe, idempotente

      const scoreResult = await HealthScoreService.calculateScore()
      if (!scoreResult.success || !scoreResult.data) return { success: true }

      const { score, factors, recommendations } = scoreResult.data
      await prisma.healthSnapshot.create({
        data: {
          score,
          ...factors,
          recommendations: JSON.stringify(recommendations),
          snapshotDate: now
        }
      })
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async getHistory(): Promise<ApiResult<Array<{ snapshotDate: Date; score: number }>>> {
    try {
      const snapshots = await db().healthSnapshot.findMany({
        orderBy: { snapshotDate: 'asc' },
        take: 6
      })
      return {
        success: true,
        data: snapshots.map((s) => ({ snapshotDate: s.snapshotDate, score: s.score }))
      }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }
}
