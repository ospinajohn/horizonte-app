import { getPrismaClient } from '../database/client'
import type { AppConfig, ApiResult } from '../../shared/types'

const db = () => getPrismaClient()

export const AppConfigService = {
  async get(): Promise<ApiResult<AppConfig>> {
    try {
      let config = await db().appConfig.findFirst()
      if (!config) {
        config = await db().appConfig.create({ data: {} })
      }
      return { success: true, data: config as AppConfig }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  async update(dto: Partial<Omit<AppConfig, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResult<AppConfig>> {
    try {
      let config = await db().appConfig.findFirst()
      if (!config) {
        config = await db().appConfig.create({ data: {} })
      }
      const updated = await db().appConfig.update({ where: { id: config.id }, data: dto })
      return { success: true, data: updated as AppConfig }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  async completeOnboarding(): Promise<ApiResult<void>> {
    try {
      const config = await db().appConfig.findFirst()
      if (config) {
        await db().appConfig.update({ where: { id: config.id }, data: { onboardingCompleted: true } })
      }
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}
