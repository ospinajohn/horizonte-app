import { getPrismaClient } from '../database/client'
import type { RecurringItem, CreateRecurringItemDto, ApiResult } from '../../shared/types'

const db = () => getPrismaClient()

export const RecurringService = {
  async getAll(onlyActive = true): Promise<ApiResult<RecurringItem[]>> {
    try {
      const items = await db().recurringItem.findMany({
        where: onlyActive ? { isActive: true } : {},
        include: { category: true, account: true },
        orderBy: { nextDate: 'asc' }
      })
      return { success: true, data: items as RecurringItem[] }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  async getUpcoming(days = 7): Promise<ApiResult<RecurringItem[]>> {
    try {
      const today = new Date()
      const until = new Date()
      until.setDate(until.getDate() + days)

      const items = await db().recurringItem.findMany({
        where: {
          isActive: true,
          nextDate: { gte: today, lte: until }
        },
        include: { category: true, account: true },
        orderBy: { nextDate: 'asc' }
      })
      return { success: true, data: items as RecurringItem[] }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  async create(dto: CreateRecurringItemDto): Promise<ApiResult<RecurringItem>> {
    try {
      const item = await db().recurringItem.create({
        data: dto,
        include: { category: true, account: true }
      })
      return { success: true, data: item as RecurringItem }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  async update(id: number, dto: Partial<CreateRecurringItemDto>): Promise<ApiResult<RecurringItem>> {
    try {
      const item = await db().recurringItem.update({
        where: { id },
        data: dto,
        include: { category: true, account: true }
      })
      return { success: true, data: item as RecurringItem }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  async delete(id: number): Promise<ApiResult<void>> {
    try {
      await db().recurringItem.update({ where: { id }, data: { isActive: false } })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Calcula la fecha siguiente según el tipo de recurrencia
   */
  getNextDate(currentDate: Date, recurrence: string): Date {
    const next = new Date(currentDate)
    switch (recurrence) {
      case 'DAILY':
        next.setDate(next.getDate() + 1)
        break
      case 'WEEKLY':
        next.setDate(next.getDate() + 7)
        break
      case 'BIWEEKLY':
        next.setDate(next.getDate() + 15)
        break
      case 'MONTHLY':
        next.setMonth(next.getMonth() + 1)
        break
      case 'ANNUAL':
        next.setFullYear(next.getFullYear() + 1)
        break
    }
    return next
  },

  async markAsPaid(id: number): Promise<ApiResult<RecurringItem>> {
    try {
      const item = await db().recurringItem.findUnique({ where: { id } })
      if (!item) return { success: false, error: 'Item recurrente no encontrado' }

      if (!item.accountId) return { success: false, error: 'El item recurrente no tiene cuenta asociada' }

      await db().transaction.create({
        data: {
          type: item.type as any,
          amount: item.amount,
          date: item.nextDate,
          description: item.name,
          accountId: item.accountId,
          ...(item.categoryId != null && { categoryId: item.categoryId }),
          isRecurring: true,
          recurringItemId: item.id
        }
      })

      const nextDate = RecurringService.getNextDate(item.nextDate, item.recurrence)
      const updated = await db().recurringItem.update({
        where: { id },
        data: { nextDate },
        include: { category: true, account: true }
      })

      return { success: true, data: updated as RecurringItem }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  /**
   * Genera proyecciones de items recurrentes para los próximos N meses
   */
  async getProjection(months = 3): Promise<ApiResult<Array<{
    date: Date
    name: string
    type: string
    amount: number
    categoryName: string | null
    color: string | null
  }>>> {
    try {
      const items = await db().recurringItem.findMany({
        where: { isActive: true },
        include: { category: true }
      })

      const today = new Date()
      const until = new Date()
      until.setMonth(until.getMonth() + months)

      const projection: Array<{
        date: Date
        name: string
        type: string
        amount: number
        categoryName: string | null
        color: string | null
      }> = []

      for (const item of items) {
        let current = new Date(item.nextDate)

        while (current <= until) {
          if (current >= today) {
            projection.push({
              date: new Date(current),
              name: item.name,
              type: item.type,
              amount: item.amount,
              categoryName: (item as any).category?.name ?? null,
              color: (item as any).category?.color ?? null
            })
          }

          if (item.recurrence === 'NONE') break
          current = RecurringService.getNextDate(current, item.recurrence)
          if (item.endDate && current > new Date(item.endDate)) break
        }
      }

      projection.sort((a, b) => a.date.getTime() - b.date.getTime())

      return { success: true, data: projection }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}
