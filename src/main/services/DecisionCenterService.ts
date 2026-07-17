import { getPrismaClient } from '../database/client'
import { DebtCapacityService } from './DebtCapacityService'
import { RecurringService } from './RecurringService'
import type { DecisionAnswer, ApiResult } from '../../shared/types'

const db = () => getPrismaClient()

function formatMoney(n: number): string {
  return `$${Math.round(n).toLocaleString('es-CO')}`
}

export const DecisionCenterService = {
  async answer(question: string): Promise<ApiResult<DecisionAnswer>> {
    try {
      const prisma = db()
      const q = question.toLowerCase()
      const now = new Date()

      // Obtener balance total actual
      const accounts = await prisma.account.findMany({ where: { isActive: true } })
      let totalBalance = 0
      for (const acc of accounts) {
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

      // Gastos mensuales promedio
      const threeMonthsAgo = new Date(now)
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      const expAgg = await prisma.transaction.aggregate({
        where: { type: 'EXPENSE', date: { gte: threeMonthsAgo } },
        _sum: { amount: true }
      })
      const monthlyExpenseAvg = (expAgg._sum.amount ?? 0) / 3
      const incAgg = await prisma.transaction.aggregate({
        where: { type: 'INCOME', date: { gte: threeMonthsAgo } },
        _sum: { amount: true }
      })
      const monthlyIncomeAvg = (incAgg._sum.amount ?? 0) / 3

      // ── Pregunta: ¿cuánto puedo gastar? / cuánto tengo disponible ────────────
      if (q.includes('cuánto puedo gastar') || q.includes('cuanto puedo gastar') ||
          q.includes('cuánto tengo disponible') || q.includes('cuanto tengo disponible') ||
          q.includes('disponible')) {

        // Compromisos próximos 7 días
        const in7Days = new Date(now)
        in7Days.setDate(in7Days.getDate() + 7)
        const upcoming = await prisma.recurringItem.findMany({
          where: { isActive: true, nextDate: { lte: in7Days }, type: { in: ['EXPENSE', 'PAYMENT'] } }
        })
        const upcomingTotal = upcoming.reduce((s, r) => s + r.amount, 0)
        const available = totalBalance - upcomingTotal

        const verdict: DecisionAnswer['verdict'] = available > monthlyExpenseAvg * 0.3 ? 'YES' : 'CONDITIONAL'

        return {
          success: true,
          data: {
            question,
            answer: `Tienes ${formatMoney(available)} disponibles para gastar hoy, después de reservar ${formatMoney(upcomingTotal)} para compromisos próximos.`,
            verdict,
            details: [
              `Balance total en cuentas: ${formatMoney(totalBalance)}`,
              `Compromisos próximos 7 días: ${formatMoney(upcomingTotal)}`,
              `Disponible real: ${formatMoney(available)}`,
              ...(upcoming.length > 0 ? upcoming.map((u) => `• ${u.name}: ${formatMoney(u.amount)}`) : ['Sin compromisos próximos'])
            ],
            numbers: [
              { label: 'Balance total', value: formatMoney(totalBalance) },
              { label: 'Compromisos próximos', value: formatMoney(upcomingTotal) },
              { label: 'Disponible', value: formatMoney(available) }
            ],
            recommendation: available > 0
              ? 'Recuerda mantener al menos 1 mes de gastos como reserva de emergencia.'
              : 'Tu disponible es bajo — evita gastos no esenciales por ahora.'
          }
        }
      }

      // ── Pregunta: ¿puedo comprar? + monto ──────────────────────────────────────
      const purchaseMatch = q.match(/\$?([\d.,]+(?:\s*(?:millones?|mil|k|m))?)/)
      const hasPurchaseIntent = q.includes('comprar') || q.includes('compra') ||
                                 q.includes('gastar') || q.includes('pagar') ||
                                 q.includes('puedo') && purchaseMatch

      if (hasPurchaseIntent && purchaseMatch) {
        // Extraer monto de la pregunta
        let rawAmount = purchaseMatch[1].replace(/\./g, '').replace(/,/g, '.')
        let amount = 0
        if (rawAmount.includes('millon') || rawAmount.includes('millón')) {
          amount = parseFloat(rawAmount) * 1_000_000
        } else if (rawAmount.includes('mil') || rawAmount.toLowerCase().includes('k')) {
          amount = parseFloat(rawAmount) * 1_000
        } else {
          amount = parseFloat(rawAmount)
        }

        if (amount > 0) {
          const canAfford = totalBalance > amount
          const comfortably = totalBalance > amount * 1.2
          const impact = amount / (monthlyIncomeAvg || 1) * 100

          let verdict: DecisionAnswer['verdict']
          if (comfortably) verdict = 'YES'
          else if (canAfford) verdict = 'CONDITIONAL'
          else verdict = 'NO'

          const afterBalance = totalBalance - amount

          return {
            success: true,
            data: {
              question,
              answer: comfortably
                ? `Sí puedes hacer esta compra. Tu liquidez lo permite sin comprometer tus finanzas.`
                : canAfford
                  ? `Puedes hacer esta compra, pero quedará ajustado. Considera el impacto en tus metas.`
                  : `No te alcanza para esta compra. Te faltan ${formatMoney(amount - totalBalance)}.`,
              verdict,
              details: [
                `Monto de la compra: ${formatMoney(amount)}`,
                `Balance actual: ${formatMoney(totalBalance)}`,
                `Balance después de la compra: ${formatMoney(afterBalance)}`,
                `Representa el ${impact.toFixed(1)}% de tu ingreso mensual promedio`
              ],
              numbers: [
                { label: 'Costo', value: formatMoney(amount) },
                { label: 'Balance actual', value: formatMoney(totalBalance) },
                { label: 'Quedarías con', value: formatMoney(afterBalance) }
              ],
              recommendation: comfortably
                ? 'Asegúrate de que esta compra no afecte tus metas de ahorro activas.'
                : canAfford
                  ? 'Revisa si puedes postponer la compra 1-2 meses para tener más margen.'
                  : `Necesitas ahorrar ${formatMoney(amount - totalBalance)} más antes de hacer esta compra.`
            }
          }
        }
      }

      // ── Pregunta: próxima quincena / próximo mes ────────────────────────────
      if (q.includes('quincena') || q.includes('próximo mes') || q.includes('proximo mes') ||
          q.includes('tendré') || q.includes('tendre') || q.includes('proyeccion') || q.includes('proyección')) {
        const projResult = await RecurringService.getProjection(1)
        const projItems = projResult.success && projResult.data ? projResult.data : []

        const projectedIncome = projItems
          .filter((i) => i.type === 'INCOME')
          .reduce((s, i) => s + i.amount, 0)
        const projectedExpense = projItems
          .filter((i) => i.type === 'EXPENSE' || i.type === 'PAYMENT')
          .reduce((s, i) => s + i.amount, 0)
        const projectedBalance = totalBalance + projectedIncome - projectedExpense

        const verdict: DecisionAnswer['verdict'] = 'INFO'

        return {
          success: true,
          data: {
            question,
            answer: `Tu saldo proyectado para el próximo mes es ${formatMoney(projectedBalance)}, considerando ingresos de ${formatMoney(projectedIncome)} y gastos de ${formatMoney(projectedExpense)}.`,
            verdict,
            details: [
              `Saldo actual: ${formatMoney(totalBalance)}`,
              `Ingresos proyectados: ${formatMoney(projectedIncome)}`,
              `Gastos proyectados: ${formatMoney(projectedExpense)}`,
              `Saldo proyectado: ${formatMoney(projectedBalance)}`
            ],
            numbers: [
              { label: 'Ingresos esperados', value: formatMoney(projectedIncome) },
              { label: 'Gastos esperados', value: formatMoney(projectedExpense) },
              { label: 'Saldo proyectado', value: formatMoney(projectedBalance) }
            ],
            recommendation: projectedBalance > 0
              ? 'Tu proyección es positiva. Considera asignar el excedente a tus metas de ahorro.'
              : 'La proyección indica un balance negativo. Revisa tus gastos recurrentes.'
          }
        }
      }

      // ── Pregunta: nueva deuda / nuevo crédito ──────────────────────────────
      if (q.includes('deuda') || q.includes('crédito') || q.includes('credito') ||
          q.includes('asumir') || q.includes('préstamo') || q.includes('prestamo')) {
        const debtResult = await DebtCapacityService.getData()
        if (debtResult.success && debtResult.data) {
          const debt = debtResult.data
          let verdict: DecisionAnswer['verdict']
          if (debt.riskLevel === 'LOW') verdict = 'YES'
          else if (debt.riskLevel === 'MEDIUM') verdict = 'CONDITIONAL'
          else verdict = 'NO'

          return {
            success: true,
            data: {
              question,
              answer: debt.riskLevel === 'LOW'
                ? `Tu capacidad de endeudamiento permite asumir nuevas deudas. Tienes ${formatMoney(debt.availableCapacity)} disponibles para nuevas cuotas.`
                : debt.riskLevel === 'MEDIUM'
                  ? `Puedes asumir una pequeña deuda, pero con precaución. Tu ratio actual es ${debt.debtRatioPercent.toFixed(1)}%.`
                  : `Tu nivel de endeudamiento es alto (${debt.debtRatioPercent.toFixed(1)}%). No es recomendable asumir más deudas ahora.`,
              verdict,
              details: [
                `Ingresos mensuales promedio: ${formatMoney(debt.monthlyIncome)}`,
                `Deuda mensual actual: ${formatMoney(debt.totalMonthlyDebt)}`,
                `Ratio de endeudamiento: ${debt.debtRatioPercent.toFixed(1)}%`,
                `Capacidad disponible (recomendado <30%): ${formatMoney(debt.availableCapacity)}`
              ],
              numbers: [
                { label: 'Ratio actual', value: `${debt.debtRatioPercent.toFixed(1)}%` },
                { label: 'Capacidad disponible', value: formatMoney(debt.availableCapacity) },
                { label: 'Riesgo', value: debt.riskLevel === 'LOW' ? 'BAJO' : debt.riskLevel === 'MEDIUM' ? 'MEDIO' : 'ALTO' }
              ],
              recommendation: debt.riskLevel === 'HIGH'
                ? 'Prioriza pagar tus deudas actuales antes de asumir nuevas obligaciones.'
                : 'El ratio ideal es mantener las cuotas de deuda por debajo del 30% de tus ingresos.'
            }
          }
        }
      }

      // ── Pregunta: qué pasa si renuncio / desempleo ─────────────────────────
      if (q.includes('renuncia') || q.includes('desempleo') || q.includes('sin trabajo') ||
          q.includes('quedara') || q.includes('quedaría') || q.includes('quedarme sin ingreso')) {
        const monthsAvailable = monthlyExpenseAvg > 0 ? totalBalance / monthlyExpenseAvg : 0

        let verdict: DecisionAnswer['verdict'] = 'INFO'

        return {
          success: true,
          data: {
            question,
            answer: `Con tu saldo actual de ${formatMoney(totalBalance)} y gastos mensuales de ${formatMoney(monthlyExpenseAvg)}, tus finanzas aguantarían aproximadamente ${monthsAvailable.toFixed(1)} meses sin ingresos.`,
            verdict,
            details: [
              `Saldo total actual: ${formatMoney(totalBalance)}`,
              `Gastos mensuales promedio: ${formatMoney(monthlyExpenseAvg)}`,
              `Meses de autonomía: ${monthsAvailable.toFixed(1)} meses`,
              monthsAvailable >= 6 ? '✅ Tienes un colchón financiero sólido' :
              monthsAvailable >= 3 ? '⚠️ Colchón financiero moderado — considera fortalecerlo' :
              '❌ Colchón financiero bajo — urgente construir fondo de emergencia'
            ],
            numbers: [
              { label: 'Meses de autonomía', value: `${monthsAvailable.toFixed(1)} meses` },
              { label: 'Gasto mensual', value: formatMoney(monthlyExpenseAvg) },
              { label: 'Reserva actual', value: formatMoney(totalBalance) }
            ],
            recommendation: monthsAvailable < 3
              ? 'Antes de cualquier cambio laboral, construye un fondo de emergencia de al menos 3-6 meses de gastos.'
              : monthsAvailable < 6
                ? 'Tienes cierto margen, pero idealmenete deberías tener 6 meses de gastos reservados antes de renunciar.'
                : 'Tienes una buena reserva. Asegúrate de tener un plan claro para el período de transición.'
          }
        }
      }

      // ── Pregunta: cuándo podré + objetivo / meta ───────────────────────────
      if (q.includes('cuándo') || q.includes('cuando') || q.includes('podré') || q.includes('podre')) {
        const goals = await prisma.savingsGoal.findMany({
          where: { isActive: true, isCompleted: false },
          orderBy: { createdAt: 'desc' }
        })

        if (goals.length > 0) {
          const monthlyBalance = monthlyIncomeAvg - monthlyExpenseAvg

          const goalsWithETA = goals.map((g) => {
            const remaining = g.targetAmount - g.currentAmount
            const months = monthlyBalance > 0 ? Math.ceil(remaining / monthlyBalance) : null
            let etaStr = 'Indefinido'
            if (months !== null) {
              const eta = new Date(now)
              eta.setMonth(eta.getMonth() + months)
              etaStr = eta.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
            }
            return { name: g.name, remaining, months, etaStr }
          })

          const first = goalsWithETA[0]

          return {
            success: true,
            data: {
              question,
              answer: first.months
                ? `Para tu meta "${first.name}", con tu ritmo actual de ahorro, podrías alcanzarla en ${first.months} meses (aprox. ${first.etaStr}).`
                : `Para alcanzar tu meta "${first.name}" necesitas mejorar tu tasa de ahorro — actualmente los ingresos no superan los gastos.`,
              verdict: 'INFO',
              details: goalsWithETA.map((g) =>
                `${g.name}: faltan ${formatMoney(g.remaining)} — ${g.months ? `${g.months} meses (${g.etaStr})` : 'indefinido'}`
              ),
              numbers: [
                { label: 'Ahorro mensual actual', value: formatMoney(Math.max(monthlyBalance, 0)) },
                { label: 'Metas activas', value: `${goals.length}` },
                { label: 'Primera meta en', value: first.months ? `${first.months} meses` : 'N/A' }
              ],
              recommendation: monthlyBalance > 0
                ? 'Considera aumentar tus aportes mensuales a las metas para alcanzarlas antes.'
                : 'Necesitas reducir gastos o aumentar ingresos para poder aportar a tus metas.'
            }
          }
        }
      }

      // ── Respuesta genérica ─────────────────────────────────────────────────
      const savingRate = monthlyIncomeAvg > 0
        ? ((monthlyIncomeAvg - monthlyExpenseAvg) / monthlyIncomeAvg) * 100
        : 0

      return {
        success: true,
        data: {
          question,
          answer: `Basado en tu estado financiero actual: tienes ${formatMoney(totalBalance)} en tus cuentas, con ingresos mensuales de ${formatMoney(monthlyIncomeAvg)} y gastos de ${formatMoney(monthlyExpenseAvg)}.`,
          verdict: 'INFO',
          details: [
            `Balance total: ${formatMoney(totalBalance)}`,
            `Ingresos mensuales promedio: ${formatMoney(monthlyIncomeAvg)}`,
            `Gastos mensuales promedio: ${formatMoney(monthlyExpenseAvg)}`,
            `Tasa de ahorro: ${savingRate.toFixed(1)}%`
          ],
          numbers: [
            { label: 'Balance total', value: formatMoney(totalBalance) },
            { label: 'Ingresos / mes', value: formatMoney(monthlyIncomeAvg) },
            { label: 'Tasa de ahorro', value: `${savingRate.toFixed(1)}%` }
          ],
          recommendation: savingRate >= 20
            ? 'Tu situación financiera es sólida. Sigue así.'
            : 'Intenta aumentar tu tasa de ahorro al 20% de tus ingresos para mayor seguridad financiera.'
        }
      }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async saveQuery(question: string, answer: DecisionAnswer): Promise<ApiResult<void>> {
    try {
      await db().decisionQuery.create({
        data: {
          question,
          answer: answer.answer,
          context: JSON.stringify({ verdict: answer.verdict, numbers: answer.numbers })
        }
      })
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async getHistory(): Promise<ApiResult<Array<{ id: number; question: string; answer: string; context: string | null; createdAt: Date }>>> {
    try {
      const history = await db().decisionQuery.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20
      })
      return { success: true, data: history as any }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }
}
