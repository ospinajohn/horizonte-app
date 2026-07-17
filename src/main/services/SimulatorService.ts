import { getPrismaClient } from '../database/client'
import type { SimulationParams, SimulationResult, SimulationScenario, ApiResult } from '../../shared/types'
import { CreditCardService } from './CreditCardService'

const db = () => getPrismaClient()

export const SimulatorService = {
  /**
   * Simula el impacto de un escenario financiero sin escribir en DB.
   * Clona el estado actual en memoria y aplica la variación.
   */
  async simulate(params: SimulationParams): Promise<ApiResult<SimulationResult>> {
    try {
      const prisma = db()

      // ── 1. Estado financiero actual ────────────────────────────────────────

      // Ingresos mensuales promedio (últimos 3 meses)
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

      const incomeAgg = await prisma.transaction.aggregate({
        where: { type: 'INCOME', date: { gte: threeMonthsAgo } },
        _sum: { amount: true },
        _count: true
      })
      const baseMonthlyIncome = incomeAgg._count > 0
        ? (incomeAgg._sum.amount ?? 0) / 3
        : 0

      // Gastos mensuales promedio (últimos 3 meses)
      const expenseAgg = await prisma.transaction.aggregate({
        where: { type: 'EXPENSE', date: { gte: threeMonthsAgo } },
        _sum: { amount: true },
        _count: true
      })
      const baseMonthlyExpense = expenseAgg._count > 0
        ? (expenseAgg._sum.amount ?? 0) / 3
        : 0

      // Deuda mensual actual (créditos + tarjetas)
      const credits = await prisma.credit.findMany({ where: { isActive: true } })
      const baseDebt = credits.reduce((sum, c) => sum + c.monthlyPayment, 0)

      // Saldo actual total
      const accounts = await prisma.account.findMany({ where: { isActive: true } })
      const transactions = await prisma.transaction.findMany({
        where: { accountId: { in: accounts.map((a) => a.id) } },
        select: { accountId: true, type: true, amount: true }
      })

      const currentBalance = accounts.reduce((total, account) => {
        const accountTxs = transactions.filter((t) => t.accountId === account.id)
        const balance = account.initialBalance + accountTxs.reduce((sum, t) => {
          if (t.type === 'INCOME' || t.type === 'TRANSFER_IN') return sum + t.amount
          return sum - t.amount
        }, 0)
        return total + balance
      }, 0)

      // ── 2. Aplicar escenario (en memoria) ─────────────────────────────────

      let simMonthlyIncome = baseMonthlyIncome
      let simMonthlyExpense = baseMonthlyExpense
      let simDebt = baseDebt
      let simCurrentBalance = currentBalance
      const recommendations: string[] = []

      switch (params.type) {
        case 'SALARY_CHANGE':
          if (params.salaryChange !== undefined) {
            simMonthlyIncome = baseMonthlyIncome * (1 + params.salaryChange / 100)
            if (params.salaryChange > 0) {
              recommendations.push(`Con un aumento del ${params.salaryChange}% en tu salario, tu capacidad de ahorro mejora significativamente.`)
              recommendations.push('Considera destinar parte del aumento a tus metas de ahorro.')
            } else {
              recommendations.push(`Una reducción del ${Math.abs(params.salaryChange)}% afectará tu flujo de caja mensual.`)
              recommendations.push('Revisa tus gastos fijos para adaptarte al nuevo ingreso.')
            }
          }
          break

        case 'NEW_CREDIT':
          if (params.newCreditMonthlyPayment !== undefined) {
            simDebt += params.newCreditMonthlyPayment
            simMonthlyExpense += params.newCreditMonthlyPayment
            recommendations.push(`La nueva cuota de ${params.newCreditMonthlyPayment.toLocaleString('es-CO')} aumentaría tu deuda mensual.`)
            const newDebtRatio = simDebt / simMonthlyIncome
            if (newDebtRatio > 0.4) {
              recommendations.push('ADVERTENCIA: El nuevo crédito llevaría tu ratio de deuda por encima del 40% recomendado.')
            } else if (newDebtRatio > 0.3) {
              recommendations.push('El crédito es asumible pero estará en zona de precaución (30-40%).')
            } else {
              recommendations.push('El crédito está dentro de los límites saludables de endeudamiento.')
            }
          }
          break

        case 'BIG_PURCHASE':
          if (params.bigPurchaseAmount !== undefined) {
            simCurrentBalance -= params.bigPurchaseAmount
            recommendations.push(`Esta compra reduciría tu saldo disponible a ${Math.round(simCurrentBalance).toLocaleString('es-CO')}.`)
            if (simCurrentBalance < 0) {
              recommendations.push('ALERTA: No tienes saldo suficiente para esta compra sin recurrir a financiación.')
            } else if (simCurrentBalance < baseMonthlyExpense * 2) {
              recommendations.push('Quedarías con menos de 2 meses de gastos en reserva. Considera aplazar o financiar parcialmente.')
            }
          }
          break

        case 'UNEMPLOYMENT':
          if (params.unemploymentMonths !== undefined) {
            const monthsWithoutIncome = params.unemploymentMonths
            simMonthlyIncome = 0
            simCurrentBalance -= baseMonthlyExpense * monthsWithoutIncome
            recommendations.push(`${monthsWithoutIncome} meses sin ingreso consumirían aproximadamente ${Math.round(baseMonthlyExpense * monthsWithoutIncome).toLocaleString('es-CO')} de tus ahorros.`)
            const monthsCovered = baseMonthlyExpense > 0 ? currentBalance / baseMonthlyExpense : 0
            if (monthsCovered < monthsWithoutIncome) {
              recommendations.push(`Tu fondo de emergencia actual solo cubriría ${monthsCovered.toFixed(1)} meses. Considera aumentarlo.`)
            } else {
              recommendations.push('Tu fondo de emergencia sería suficiente para este período.')
            }
          }
          break

        case 'EXPENSE_CHANGE':
          if (params.expenseChangePercent !== undefined) {
            simMonthlyExpense = baseMonthlyExpense * (1 + params.expenseChangePercent / 100)
            if (params.expenseChangePercent > 0) {
              recommendations.push(`Un aumento del ${params.expenseChangePercent}% en gastos reduce tu capacidad de ahorro.`)
            } else {
              recommendations.push(`Reducir gastos un ${Math.abs(params.expenseChangePercent)}% mejoraría significativamente tu situación financiera.`)
            }
          }
          break

        default:
          break
      }

      // ── 3. Calcular proyecciones ───────────────────────────────────────────

      const simMonthlyCashflow = simMonthlyIncome - simMonthlyExpense
      const simSavingsCapacity = Math.max(simMonthlyCashflow, 0)

      const projectedBalance3M = simCurrentBalance + simMonthlyCashflow * 3
      const projectedBalance6M = simCurrentBalance + simMonthlyCashflow * 6
      const projectedBalance12M = simCurrentBalance + simMonthlyCashflow * 12

      const simDebtRatio = simMonthlyIncome > 0 ? (simDebt / simMonthlyIncome) * 100 : 100

      const canAfford = projectedBalance3M >= 0 && simMonthlyCashflow >= 0 && simDebtRatio <= 40

      // ── 4. Resumen de impacto ──────────────────────────────────────────────

      let impactSummary = ''
      if (simMonthlyCashflow > 0) {
        impactSummary = `Con este escenario tendrías un flujo mensual positivo de ${Math.round(simMonthlyCashflow).toLocaleString('es-CO')}. `
      } else {
        impactSummary = `Este escenario generaría un déficit mensual de ${Math.round(Math.abs(simMonthlyCashflow)).toLocaleString('es-CO')}. `
      }

      if (projectedBalance12M > 0) {
        impactSummary += `En 12 meses tu saldo proyectado sería de ${Math.round(projectedBalance12M).toLocaleString('es-CO')}.`
      } else {
        impactSummary += `En 12 meses entrarías en números rojos (${Math.round(projectedBalance12M).toLocaleString('es-CO')}).`
      }

      if (recommendations.length === 0) {
        recommendations.push('Revisa periódicamente tu situación financiera para mantener el control.')
      }

      const result: SimulationResult = {
        scenarioName: params.name,
        projectedBalance3M: Math.round(projectedBalance3M),
        projectedBalance6M: Math.round(projectedBalance6M),
        projectedBalance12M: Math.round(projectedBalance12M),
        monthlyCashflow: Math.round(simMonthlyCashflow),
        savingsCapacity: Math.round(simSavingsCapacity),
        debtRatio: Math.round(simDebtRatio * 10) / 10,
        canAfford,
        impactSummary,
        recommendations
      }

      return { success: true, data: result }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async saveScenario(params: SimulationParams, result: SimulationResult): Promise<ApiResult<SimulationScenario>> {
    try {
      const scenario = await db().simulationScenario.create({
        data: {
          name: params.name,
          type: params.type,
          description: result.impactSummary,
          parameters: JSON.stringify(params),
          results: JSON.stringify(result)
        }
      })
      return { success: true, data: scenario as SimulationScenario }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async getSavedScenarios(): Promise<ApiResult<SimulationScenario[]>> {
    try {
      const scenarios = await db().simulationScenario.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20
      })
      return { success: true, data: scenarios as SimulationScenario[] }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }
}
