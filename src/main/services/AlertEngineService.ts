import { getPrismaClient } from '../database/client'
import { AlertService } from './AlertService'
import { RecurringService } from './RecurringService'
import { BudgetService } from './BudgetService'
import { AccountService } from './AccountService'
import { Notification } from 'electron'

const db = () => getPrismaClient()

export const AlertEngineService = {
  async run(): Promise<void> {
    try {
      await Promise.all([
        AlertEngineService.checkUpcomingPayments(),
        AlertEngineService.checkBudgetWarnings(),
        AlertEngineService.checkNegativeProjection()
      ])
    } catch (e) {
      console.error('[AlertEngine] Error durante la ejecución:', e)
    }
  },

  /**
   * Alertas 3 días y 1 día antes de pagos en RecurringItem tipo EXPENSE/PAYMENT
   */
  async checkUpcomingPayments(): Promise<void> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const in3days = new Date(today)
      in3days.setDate(in3days.getDate() + 3)
      in3days.setHours(23, 59, 59, 999)

      const items = await db().recurringItem.findMany({
        where: {
          isActive: true,
          type: { in: ['EXPENSE', 'PAYMENT'] },
          nextDate: { gte: today, lte: in3days }
        }
      })

      for (const item of items) {
        const nextDate = new Date(item.nextDate)
        const diffMs = nextDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

        // Solo para 1 y 3 días
        if (diffDays !== 1 && diffDays !== 3) continue

        // Verificar si ya existe alerta para este item hoy
        const existingToday = await db().alert.findFirst({
          where: {
            type: 'PAYMENT_DUE',
            relatedId: item.id,
            relatedType: 'RECURRING',
            createdAt: { gte: today }
          }
        })

        if (!existingToday) {
          const daysLabel = diffDays === 1 ? 'mañana' : 'en 3 días'
          await AlertService.create({
            type: 'PAYMENT_DUE',
            severity: diffDays === 1 ? 'CRITICAL' : 'WARNING',
            title: `Pago próximo: ${item.name}`,
            message: `Tienes un pago de ${item.name} por $${item.amount.toLocaleString('es-CO')} ${daysLabel}.`,
            relatedId: item.id,
            relatedType: 'RECURRING'
          })

          // Notificación nativa
          if (Notification.isSupported()) {
            try {
              new Notification({
                title: `Pago próximo: ${item.name}`,
                body: `Vence ${daysLabel} — $${item.amount.toLocaleString('es-CO')}`
              }).show()
            } catch {
              // silenciar errores de notificación en entornos sin soporte
            }
          }
        }
      }
    } catch (e) {
      console.error('[AlertEngine] checkUpcomingPayments error:', e)
    }
  },

  /**
   * Alerta cuando una categoría de presupuesto supera 80% y 100%
   */
  async checkBudgetWarnings(): Promise<void> {
    try {
      const budgetResult = await BudgetService.getActiveWithSpending()
      if (!budgetResult.success || !budgetResult.data) return

      const budget = budgetResult.data
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      for (const cat of budget.categories) {
        if (!cat.percentage) continue

        const isOver100 = cat.percentage >= 100
        const isOver80 = cat.percentage >= 80 && !isOver100

        const level = isOver100 ? 100 : isOver80 ? 80 : null
        if (!level) continue

        // Verificar alerta existente hoy para este presupuesto-categoría
        const existing = await db().alert.findFirst({
          where: {
            type: 'BUDGET_WARNING',
            relatedId: cat.id,
            relatedType: 'BUDGET_CATEGORY',
            createdAt: { gte: today }
          }
        })

        if (!existing) {
          const catName = cat.category?.name ?? 'Categoría'
          const pct = Math.round(cat.percentage)

          await AlertService.create({
            type: isOver100 ? 'BUDGET_EXCEEDED' : 'BUDGET_WARNING',
            severity: isOver100 ? 'CRITICAL' : 'WARNING',
            title: `Presupuesto ${isOver100 ? 'excedido' : 'al límite'}: ${catName}`,
            message: `Has usado el ${pct}% de tu límite para "${catName}" (${cat.spent?.toLocaleString('es-CO')} / ${cat.limit?.toLocaleString('es-CO')}).`,
            relatedId: cat.id,
            relatedType: 'BUDGET_CATEGORY'
          })

          if (Notification.isSupported()) {
            try {
              new Notification({
                title: `Presupuesto ${isOver100 ? 'excedido' : 'al límite'}: ${catName}`,
                body: `Has consumido el ${pct}% del límite asignado.`
              }).show()
            } catch {
              // silenciar
            }
          }
        }
      }
    } catch (e) {
      console.error('[AlertEngine] checkBudgetWarnings error:', e)
    }
  },

  /**
   * Alerta cuando el saldo proyectado cae a negativo en 7 días
   */
  async checkNegativeProjection(): Promise<void> {
    try {
      const balanceResult = await AccountService.getTotalBalance()
      const projResult = await RecurringService.getProjection(1)

      if (!balanceResult.success || !projResult.success || !projResult.data) return

      let runningBalance = balanceResult.data ?? 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const in7days = new Date(today)
      in7days.setDate(in7days.getDate() + 7)

      // Solo mirar los próximos 7 días
      const next7 = projResult.data.filter((p) => {
        const d = new Date(p.date)
        return d >= today && d <= in7days
      })

      let goesNegative = false
      for (const item of next7) {
        if (item.type === 'INCOME') {
          runningBalance += item.amount
        } else {
          runningBalance -= item.amount
        }
        if (runningBalance < 0) {
          goesNegative = true
          break
        }
      }

      if (goesNegative) {
        // Verificar si ya existe alerta de balance negativo hoy
        const existing = await db().alert.findFirst({
          where: {
            type: 'NEGATIVE_BALANCE',
            createdAt: { gte: today }
          }
        })

        if (!existing) {
          await AlertService.create({
            type: 'NEGATIVE_BALANCE',
            severity: 'CRITICAL',
            title: 'Saldo proyectado negativo',
            message: 'Con los pagos programados de los próximos 7 días, tu saldo proyectado caerá a negativo. Revisa tus cuentas.'
          })

          if (Notification.isSupported()) {
            try {
              new Notification({
                title: 'Alerta: Saldo proyectado negativo',
                body: 'Tu saldo podría quedar en negativo en los próximos 7 días.'
              }).show()
            } catch {
              // silenciar
            }
          }
        }
      }
    } catch (e) {
      console.error('[AlertEngine] checkNegativeProjection error:', e)
    }
  }
}
