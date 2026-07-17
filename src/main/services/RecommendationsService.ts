import { getPrismaClient } from '../database/client'
import type { RecommendationLog, ApiResult } from '../../shared/types'

const db = () => getPrismaClient()

export const RecommendationsService = {
  async generate(): Promise<ApiResult<RecommendationLog[]>> {
    try {
      const prisma = db()
      const now = new Date()
      const thirtyDaysAgo = new Date(now)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const threeMonthsAgo = new Date(now)
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      const created: RecommendationLog[] = []

      const alreadyExists = async (type: string): Promise<boolean> => {
        const count = await prisma.recommendationLog.count({
          where: { type, createdAt: { gte: thirtyDaysAgo } }
        })
        return count > 0
      }

      // 1. SAVINGS: categoría con gasto > 30% del total
      if (!(await alreadyExists('SAVINGS'))) {
        const expByCat = await prisma.transaction.groupBy({
          by: ['categoryId'],
          where: { type: 'EXPENSE', date: { gte: startOfMonth } },
          _sum: { amount: true }
        })
        const totalExp = expByCat.reduce((s, r) => s + (r._sum.amount ?? 0), 0)

        if (totalExp > 0) {
          const dominant = expByCat
            .filter((r) => r.categoryId !== null)
            .sort((a, b) => (b._sum.amount ?? 0) - (a._sum.amount ?? 0))[0]

          if (dominant) {
            const ratio = (dominant._sum.amount ?? 0) / totalExp
            if (ratio >= 0.30) {
              const cat = await prisma.category.findUnique({ where: { id: dominant.categoryId! } })
              const catName = cat?.name ?? 'esta categoría'
              const potentialSaving = Math.round((dominant._sum.amount ?? 0) * 0.2)
              const rec = await prisma.recommendationLog.create({
                data: {
                  type: 'SAVINGS',
                  title: `Oportunidad de ahorro en ${catName}`,
                  description: `${catName} representa el ${Math.round(ratio * 100)}% de tus gastos este mes. Reducirla un 20% te ahorraría $${potentialSaving.toLocaleString()} mensualmente.`,
                  impact: `Ahorro potencial: $${potentialSaving.toLocaleString()} / mes`,
                  actionPath: '/transacciones'
                }
              })
              created.push(rec as unknown as RecommendationLog)
            }
          }
        }
      }

      // 2. DEBT_OPTIMIZATION: múltiples créditos activos
      if (!(await alreadyExists('DEBT_OPTIMIZATION'))) {
        const credits = await prisma.credit.findMany({
          where: { isActive: true, status: 'ACTIVE' },
          orderBy: { annualRate: 'desc' }
        })
        if (credits.length > 1) {
          const highest = credits[0]
          const rec = await prisma.recommendationLog.create({
            data: {
              type: 'DEBT_OPTIMIZATION',
              title: 'Optimiza el pago de tus créditos',
              description: `Tienes ${credits.length} créditos activos. El crédito de ${highest.entityName} tiene la tasa más alta (${highest.annualRate.toFixed(1)}% EA). Prioriza pagarlo primero para reducir intereses.`,
              impact: `Tasa más alta: ${highest.annualRate.toFixed(1)}% EA — ${highest.entityName}`,
              actionPath: '/creditos'
            }
          })
          created.push(rec as unknown as RecommendationLog)
        }
      }

      // 3. TIMING: si el balance promedio < alguna meta
      if (!(await alreadyExists('TIMING'))) {
        const goals = await prisma.savingsGoal.findMany({
          where: { isActive: true, isCompleted: false }
        })
        if (goals.length > 0) {
          const incomeAgg = await prisma.transaction.aggregate({
            where: { type: 'INCOME', date: { gte: threeMonthsAgo } },
            _sum: { amount: true }
          })
          const expenseAgg = await prisma.transaction.aggregate({
            where: { type: 'EXPENSE', date: { gte: threeMonthsAgo } },
            _sum: { amount: true }
          })
          const monthlyBalance = ((incomeAgg._sum.amount ?? 0) - (expenseAgg._sum.amount ?? 0)) / 3

          const pendingGoal = goals.sort((a, b) => {
            const remainA = a.targetAmount - a.currentAmount
            const remainB = b.targetAmount - b.currentAmount
            return remainA - remainB
          })[0]

          const remaining = pendingGoal.targetAmount - pendingGoal.currentAmount
          if (remaining > 0 && monthlyBalance > 0) {
            const months = Math.ceil(remaining / monthlyBalance)
            if (months > 1) {
              const rec = await prisma.recommendationLog.create({
                data: {
                  type: 'TIMING',
                  title: `Meta "${pendingGoal.name}": ${months} meses para alcanzarla`,
                  description: `Con tu ritmo de ahorro actual ($${Math.round(monthlyBalance).toLocaleString()}/mes), alcanzarás la meta "${pendingGoal.name}" en aproximadamente ${months} meses. Aumenta tus aportes para lograrlo antes.`,
                  impact: `Falta: $${Math.round(remaining).toLocaleString()} — ${months} meses al ritmo actual`,
                  actionPath: '/metas'
                }
              })
              created.push(rec as unknown as RecommendationLog)
            }
          }
        }
      }

      // 4. INVESTMENT: fondo de emergencia completo
      if (!(await alreadyExists('INVESTMENT'))) {
        const emergencyAccounts = await prisma.account.findMany({
          where: { isEmergencyFund: true, isActive: true }
        })
        if (emergencyAccounts.length > 0) {
          let efBalance = 0
          for (const acc of emergencyAccounts) {
            const income = await prisma.transaction.aggregate({
              where: { accountId: acc.id, type: { in: ['INCOME', 'TRANSFER_IN'] } },
              _sum: { amount: true }
            })
            const expense = await prisma.transaction.aggregate({
              where: { accountId: acc.id, type: { in: ['EXPENSE', 'TRANSFER_OUT'] } },
              _sum: { amount: true }
            })
            efBalance += acc.initialBalance + (income._sum.amount ?? 0) - (expense._sum.amount ?? 0)
          }

          const expAgg = await prisma.transaction.aggregate({
            where: { type: 'EXPENSE', date: { gte: threeMonthsAgo } },
            _sum: { amount: true }
          })
          const monthlyExp = (expAgg._sum.amount ?? 0) / 3
          const monthsCovered = monthlyExp > 0 ? efBalance / monthlyExp : 0

          if (monthsCovered >= 6) {
            const rec = await prisma.recommendationLog.create({
              data: {
                type: 'INVESTMENT',
                title: 'Tu fondo de emergencia está completo — considera invertir',
                description: `Tienes ${monthsCovered.toFixed(1)} meses de gastos en tu fondo de emergencia (meta: 6 meses). El excedente podría generar rendimientos en una cuenta de inversión o CDT.`,
                impact: 'Excedente disponible para inversión',
                actionPath: '/patrimonio'
              }
            })
            created.push(rec as unknown as RecommendationLog)
          }
        }
      }

      // Retornar todas las recomendaciones actualizadas
      const all = await prisma.recommendationLog.findMany({
        orderBy: { createdAt: 'desc' }
      })
      return { success: true, data: all as unknown as RecommendationLog[] }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async getAll(): Promise<ApiResult<RecommendationLog[]>> {
    try {
      const all = await db().recommendationLog.findMany({
        orderBy: { createdAt: 'desc' }
      })
      return { success: true, data: all as unknown as RecommendationLog[] }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async markRead(id: number): Promise<ApiResult<void>> {
    try {
      await db().recommendationLog.update({ where: { id }, data: { isRead: true } })
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async markApplied(id: number): Promise<ApiResult<void>> {
    try {
      await db().recommendationLog.update({ where: { id }, data: { isApplied: true, isRead: true } })
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }
}
