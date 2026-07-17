import { getPrismaClient } from '../database/client'
import type {
  CreditCard,
  CreditCardPurchase,
  CreateCreditCardDto,
  CreateCreditCardPurchaseDto,
  ApiResult
} from '../../shared/types'

const db = () => getPrismaClient()

export const CreditCardService = {
  /**
   * Retorna el período de facturación actual en formato "YYYY-MM"
   */
  getCurrentBillingPeriod(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  },

  async getAll(): Promise<ApiResult<CreditCard[]>> {
    try {
      const cards = await db().creditCard.findMany({
        where: { isActive: true },
        include: { purchases: { orderBy: { date: 'desc' } } },
        orderBy: { createdAt: 'desc' }
      })
      return { success: true, data: cards as CreditCard[] }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async getById(id: number): Promise<ApiResult<CreditCard>> {
    try {
      const card = await db().creditCard.findUnique({
        where: { id },
        include: { purchases: { orderBy: { date: 'desc' } } }
      })
      if (!card) return { success: false, error: 'Tarjeta no encontrada' }
      return { success: true, data: card as CreditCard }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async getWithBalance(id: number): Promise<ApiResult<CreditCard & { usedAmount: number; availableLimit: number }>> {
    try {
      const card = await db().creditCard.findUnique({
        where: { id },
        include: { purchases: { orderBy: { date: 'desc' } } }
      })
      if (!card) return { success: false, error: 'Tarjeta no encontrada' }

      const currentPeriod = CreditCardService.getCurrentBillingPeriod()
      const periodPurchases = (card.purchases as CreditCardPurchase[]).filter(
        (p) => p.billingPeriod === currentPeriod
      )

      const usedAmount = periodPurchases.reduce((sum, p) => sum + p.amount, 0)
      const availableLimit = Math.max(card.totalLimit - usedAmount, 0)

      return {
        success: true,
        data: {
          ...(card as CreditCard),
          usedAmount,
          availableLimit
        }
      }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async create(dto: CreateCreditCardDto): Promise<ApiResult<CreditCard>> {
    try {
      const card = await db().creditCard.create({
        data: {
          name: dto.name,
          bank: dto.bank,
          totalLimit: dto.totalLimit,
          cutDay: dto.cutDay,
          paymentDay: dto.paymentDay,
          annualRate: dto.annualRate ?? 0,
          color: dto.color ?? '#6366f1'
        }
      })
      return { success: true, data: card as CreditCard }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async update(id: number, dto: Partial<CreateCreditCardDto>): Promise<ApiResult<CreditCard>> {
    try {
      const card = await db().creditCard.update({
        where: { id },
        data: dto
      })
      return { success: true, data: card as CreditCard }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async delete(id: number): Promise<ApiResult<void>> {
    try {
      await db().creditCard.update({ where: { id }, data: { isActive: false } })
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async addPurchase(dto: CreateCreditCardPurchaseDto): Promise<ApiResult<CreditCardPurchase>> {
    try {
      const billingPeriod = dto.billingPeriod ?? CreditCardService.getCurrentBillingPeriod()
      const purchase = await db().creditCardPurchase.create({
        data: {
          cardId: dto.cardId,
          description: dto.description,
          amount: dto.amount,
          date: new Date(dto.date),
          installments: dto.installments ?? 1,
          isAdvance: dto.isAdvance ?? false,
          billingPeriod
        }
      })
      return { success: true, data: purchase as CreditCardPurchase }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }
}
