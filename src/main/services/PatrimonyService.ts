import { getPrismaClient } from '../database/client'
import type { PatrimonyData, ApiResult } from '../../shared/types'
import { CreditCardService } from './CreditCardService'

const db = () => getPrismaClient()

export const PatrimonyService = {
  async getData(): Promise<ApiResult<PatrimonyData>> {
    try {
      const prisma = db()

      // 1. Activos
      const assets = await prisma.asset.findMany({ where: { isActive: true } })
      const totalAssets = assets.reduce((sum, a) => sum + a.currentValue, 0)

      // 2. Créditos activos
      const credits = await prisma.credit.findMany({ where: { isActive: true } })
      const creditsPending = credits.reduce((sum, c) => sum + c.pendingAmount, 0)

      // 3. Tarjetas de crédito — deuda período actual
      const cards = await prisma.creditCard.findMany({
        where: { isActive: true },
        include: { purchases: true }
      })
      const currentPeriod = CreditCardService.getCurrentBillingPeriod()
      const creditCardDebt = cards.reduce((sum, card) => {
        const periodPurchases = card.purchases.filter((p) => p.billingPeriod === currentPeriod)
        return sum + periodPurchases.reduce((s, p) => s + p.amount, 0)
      }, 0)

      // 4. Pasivos adicionales
      const liabilities = await prisma.liability.findMany({ where: { isActive: true } })
      const additionalLiabilities = liabilities.reduce((sum, l) => sum + l.amount, 0)

      const totalLiabilities = creditsPending + creditCardDebt + additionalLiabilities
      const netWorth = totalAssets - totalLiabilities

      // 5. Historial de snapshots (últimos 12)
      const snapshots = await prisma.patrimonySnapshot.findMany({
        orderBy: { snapshotDate: 'desc' },
        take: 12
      })

      const history = snapshots.reverse().map((s) => ({
        snapshotDate: s.snapshotDate,
        netWorth: s.netWorth,
        totalAssets: s.totalAssets,
        totalLiabilities: s.totalLiabilities
      }))

      return {
        success: true,
        data: {
          totalAssets,
          totalLiabilities,
          netWorth,
          assets: assets as any,
          liabilities: liabilities as any,
          creditsPending,
          creditCardDebt,
          history
        }
      }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async takeSnapshot(): Promise<ApiResult<void>> {
    try {
      const prisma = db()
      const now = new Date()
      const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

      // Verificar si ya existe snapshot del mes actual
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      const existing = await prisma.patrimonySnapshot.findFirst({
        where: { snapshotDate: { gte: startOfMonth, lte: endOfMonth } }
      })

      if (existing) {
        return { success: true } // Ya existe uno este mes
      }

      const dataResult = await PatrimonyService.getData()
      if (!dataResult.success || !dataResult.data) {
        return { success: false, error: 'No se pudo calcular el patrimonio' }
      }

      const { totalAssets, totalLiabilities, netWorth } = dataResult.data

      await prisma.patrimonySnapshot.create({
        data: {
          totalAssets,
          totalLiabilities,
          netWorth,
          snapshotDate: now
        }
      })

      void yearMonth // suppress unused variable warning

      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async createAsset(dto: {
    name: string
    type: string
    currentValue: number
    acquisitionValue?: number
    acquisitionDate?: Date
    description?: string
  }): Promise<ApiResult<any>> {
    try {
      const asset = await db().asset.create({
        data: {
          name: dto.name,
          type: dto.type,
          currentValue: dto.currentValue,
          acquisitionValue: dto.acquisitionValue ?? 0,
          acquisitionDate: dto.acquisitionDate ? new Date(dto.acquisitionDate) : null,
          description: dto.description ?? null
        }
      })
      return { success: true, data: asset }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async updateAsset(id: number, dto: Partial<{
    name: string
    type: string
    currentValue: number
    acquisitionValue: number
    acquisitionDate: Date
    description: string
  }>): Promise<ApiResult<any>> {
    try {
      const data: any = { ...dto }
      if (dto.acquisitionDate) data.acquisitionDate = new Date(dto.acquisitionDate)
      const asset = await db().asset.update({ where: { id }, data })
      return { success: true, data: asset }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async deleteAsset(id: number): Promise<ApiResult<void>> {
    try {
      await db().asset.update({ where: { id }, data: { isActive: false } })
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async createLiability(dto: {
    name: string
    amount: number
    creditor?: string
    dueDate?: Date
    notes?: string
  }): Promise<ApiResult<any>> {
    try {
      const liability = await db().liability.create({
        data: {
          name: dto.name,
          amount: dto.amount,
          creditor: dto.creditor ?? null,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          notes: dto.notes ?? null
        }
      })
      return { success: true, data: liability }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async deleteLiability(id: number): Promise<ApiResult<void>> {
    try {
      await db().liability.update({ where: { id }, data: { isActive: false } })
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }
}
