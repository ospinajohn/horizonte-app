import { getPrismaClient } from '../database/client'
import type { Alert, AlertType, AlertSeverity, ApiResult } from '../../shared/types'

const db = () => getPrismaClient()

export const AlertService = {
  async getAll(onlyUnread = false): Promise<ApiResult<Alert[]>> {
    try {
      const alerts = await db().alert.findMany({
        where: {
          isDismissed: false,
          ...(onlyUnread ? { isRead: false } : {})
        },
        orderBy: { createdAt: 'desc' }
      })
      return { success: true, data: alerts as Alert[] }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  async getUnreadCount(): Promise<ApiResult<number>> {
    try {
      const count = await db().alert.count({ where: { isRead: false, isDismissed: false } })
      return { success: true, data: count }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  async create(dto: {
    type: AlertType
    severity: AlertSeverity
    title: string
    message: string
    relatedId?: number
    relatedType?: string
  }): Promise<ApiResult<Alert>> {
    try {
      const alert = await db().alert.create({ data: dto })
      return { success: true, data: alert as Alert }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  async markAsRead(id: number): Promise<ApiResult<void>> {
    try {
      await db().alert.update({ where: { id }, data: { isRead: true } })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  async markAllAsRead(): Promise<ApiResult<void>> {
    try {
      await db().alert.updateMany({ where: { isRead: false }, data: { isRead: true } })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  async dismiss(id: number): Promise<ApiResult<void>> {
    try {
      await db().alert.update({ where: { id }, data: { isDismissed: true } })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}
