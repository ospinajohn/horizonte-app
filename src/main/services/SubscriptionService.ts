import { getPrismaClient } from '../database/client'
import type { Subscription, CreateSubscriptionDto, ApiResult } from '../../shared/types'
import { AlertService } from './AlertService'

const db = () => getPrismaClient()

export const SubscriptionService = {
  async getAll(): Promise<ApiResult<Subscription[]>> {
    try {
      const subs = await db().subscription.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      })
      return { success: true, data: subs as Subscription[] }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async create(dto: CreateSubscriptionDto): Promise<ApiResult<Subscription>> {
    try {
      const sub = await db().$transaction(async (tx) => {
        // 1. Crear la suscripción
        const subscription = await tx.subscription.create({
          data: {
            name: dto.name,
            amount: dto.amount,
            billingDay: dto.billingDay,
            category: dto.category ?? 'ENTERTAINMENT',
            accountId: dto.accountId ?? null,
            notes: dto.notes ?? null,
            color: dto.color ?? '#6366f1',
            icon: dto.icon ?? 'repeat'
          }
        })

        // 2. Crear RecurringItem asociado
        const nextDate = new Date()
        nextDate.setDate(dto.billingDay)
        if (nextDate < new Date()) {
          nextDate.setMonth(nextDate.getMonth() + 1)
        }

        const recurringItem = await tx.recurringItem.create({
          data: {
            name: dto.name,
            type: 'EXPENSE',
            amount: dto.amount,
            recurrence: 'MONTHLY',
            nextDate,
            description: `Suscripción ${dto.name}`,
            accountId: dto.accountId ?? null,
            isActive: true
          }
        })

        // 3. Vincular RecurringItem a la suscripción
        return tx.subscription.update({
          where: { id: subscription.id },
          data: { recurringItemId: recurringItem.id }
        })
      })

      return { success: true, data: sub as Subscription }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async update(id: number, dto: Partial<CreateSubscriptionDto> & { lastBilledAmount?: number; isActive?: boolean }): Promise<ApiResult<Subscription>> {
    try {
      const sub = await db().subscription.update({
        where: { id },
        data: dto
      })
      return { success: true, data: sub as Subscription }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async delete(id: number): Promise<ApiResult<void>> {
    try {
      await db().subscription.update({ where: { id }, data: { isActive: false } })
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async getTotals(): Promise<ApiResult<{ monthly: number; annual: number }>> {
    try {
      const result = await db().subscription.aggregate({
        where: { isActive: true },
        _sum: { amount: true }
      })
      const monthly = result._sum.amount ?? 0
      return { success: true, data: { monthly: Math.round(monthly), annual: Math.round(monthly * 12) } }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async checkPriceChanges(): Promise<ApiResult<void>> {
    try {
      const subs = await db().subscription.findMany({ where: { isActive: true } })

      for (const sub of subs) {
        if (
          sub.lastBilledAmount !== null &&
          sub.lastBilledAmount !== undefined &&
          sub.lastBilledAmount !== sub.amount
        ) {
          const diff = sub.amount - sub.lastBilledAmount
          const pct = ((diff / sub.lastBilledAmount) * 100).toFixed(1)
          await AlertService.create({
            type: 'CUSTOM',
            severity: 'WARNING',
            title: `Cambio de precio: ${sub.name}`,
            message: `El precio de ${sub.name} cambió de ${sub.lastBilledAmount.toLocaleString('es-CO')} a ${sub.amount.toLocaleString('es-CO')} (${diff > 0 ? '+' : ''}${pct}%).`,
            relatedId: sub.id,
            relatedType: 'Subscription'
          })
        }
      }

      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }
}
