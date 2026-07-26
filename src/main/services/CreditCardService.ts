import { getPrismaClient } from '../database/client'
import { wrapService } from '../lib/wrapService'
import { getCardStatus } from '../lib/billingCycleEngine'
import { createCreditCardSchema, updateCreditCardSchema, validateDto } from '../../shared/validation'
import type {
  CreditCard,
  CreditCardPurchase,
  CreateCreditCardDto,
  CreateCreditCardPurchaseDto,
  CardBenefitType,
  CardIntelligence,
  CardRecommendation,
  ApiResult
} from '../../shared/types'

const db = () => getPrismaClient()

function parseBenefitTypes(raw: string | null): CardBenefitType[] {
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function parseBenefitCategories(raw: string | null): string[] {
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function mapCard(raw: any): CreditCard {
  return {
    ...raw,
    benefitTypes: parseBenefitTypes(raw.benefitTypes),
    benefitCategories: parseBenefitCategories(raw.benefitCategories)
  }
}

export const CreditCardService = {
  /**
   * Retorna el período de facturación actual en formato "YYYY-MM"
   */
  getCurrentBillingPeriod(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  },

  async getAll(): Promise<ApiResult<CreditCard[]>> {
    return wrapService(async () => {
      const cards = await db().creditCard.findMany({
        where: { isActive: true },
        include: { purchases: { orderBy: { date: 'desc' } } },
        orderBy: { createdAt: 'desc' }
      })
      return cards.map(mapCard)
    })
  },

  async getById(id: number): Promise<ApiResult<CreditCard>> {
    return wrapService(async () => {
      const card = await db().creditCard.findUnique({
        where: { id },
        include: { purchases: { orderBy: { date: 'desc' } } }
      })
      if (!card) throw new Error('Tarjeta no encontrada')
      return mapCard(card)
    })
  },

  async getWithBalance(id: number): Promise<ApiResult<CreditCard & { usedAmount: number; availableLimit: number }>> {
    return wrapService(async () => {
      const card = await db().creditCard.findUnique({
        where: { id },
        include: { purchases: { orderBy: { date: 'desc' } } }
      })
      if (!card) throw new Error('Tarjeta no encontrada')

      const currentPeriod = CreditCardService.getCurrentBillingPeriod()
      const periodPurchases = (card.purchases as CreditCardPurchase[]).filter(
        (p) => p.billingPeriod === currentPeriod
      )

      const usedAmount = periodPurchases.reduce((sum, p) => sum + p.amount, 0)
      const availableLimit = Math.max(card.totalLimit - usedAmount, 0)

      return {
        ...mapCard(card),
        usedAmount,
        availableLimit
      }
    })
  },

  async create(dto: CreateCreditCardDto): Promise<ApiResult<CreditCard>> {
    return wrapService(async () => {
      const data = validateDto(createCreditCardSchema, dto)
      const card = await db().creditCard.create({
        data: {
          name: data.name,
          bank: data.bank,
          totalLimit: data.totalLimit,
          cutDay: data.cutDay,
          paymentDay: data.paymentDay,
          annualRate: data.annualRate ?? 0,
          color: data.color ?? '#6366f1',
          franchise: data.franchise,
          cashbackPercent: data.cashbackPercent ?? 0,
          benefitTypes: data.benefitTypes ? JSON.stringify(data.benefitTypes) : null,
          benefitCategories: data.benefitCategories ? JSON.stringify(data.benefitCategories) : null
        }
      })
      return mapCard(card)
    })
  },

  async update(id: number, dto: Partial<CreateCreditCardDto>): Promise<ApiResult<CreditCard>> {
    return wrapService(async () => {
      const data = validateDto(updateCreditCardSchema, dto)
      const card = await db().creditCard.update({
        where: { id },
        data: {
          ...data,
          benefitTypes: data.benefitTypes !== undefined ? JSON.stringify(data.benefitTypes) : undefined,
          benefitCategories:
            data.benefitCategories !== undefined ? JSON.stringify(data.benefitCategories) : undefined
        }
      })
      return mapCard(card)
    })
  },

  async delete(id: number): Promise<ApiResult<void>> {
    return wrapService(async () => {
      await db().creditCard.update({ where: { id }, data: { isActive: false } })
    })
  },

  async addPurchase(dto: CreateCreditCardPurchaseDto): Promise<ApiResult<CreditCardPurchase>> {
    return wrapService(async () => {
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
      return purchase as CreditCardPurchase
    })
  },

  /**
   * Estado de una tarjeta según el motor de ciclos de facturación:
   * días hasta el corte/pago y clasificación EXCELLENT/GOOD/NORMAL/AVOID.
   */
  async getIntelligence(id: number): Promise<ApiResult<CardIntelligence>> {
    return wrapService(async () => {
      const cardResult = await CreditCardService.getWithBalance(id)
      if (!cardResult.success || !cardResult.data) {
        throw new Error(cardResult.error ?? 'Tarjeta no encontrada')
      }
      const card = cardResult.data
      const statusResult = getCardStatus(card.cutDay, card.paymentDay)

      return {
        cardId: card.id,
        name: card.name,
        bank: card.bank,
        color: card.color,
        status: statusResult.status,
        daysUntilCut: statusResult.daysUntilCut,
        daysUntilPayment: statusResult.daysUntilPayment,
        financingDaysIfPurchaseToday: statusResult.financingDaysIfPurchaseToday,
        cutDate: statusResult.cycle.cutDate,
        paymentDate: statusResult.cycle.paymentDate,
        availableLimit: card.availableLimit,
        cashbackPercent: card.cashbackPercent ?? 0,
        benefitTypes: card.benefitTypes ?? [],
        benefitCategories: card.benefitCategories ?? []
      }
    })
  },

  async getAllIntelligence(): Promise<ApiResult<CardIntelligence[]>> {
    return wrapService(async () => {
      const cardsResult = await CreditCardService.getAll()
      if (!cardsResult.success || !cardsResult.data) {
        throw new Error(cardsResult.error ?? 'No se pudieron cargar las tarjetas')
      }

      const intelligence = await Promise.all(
        cardsResult.data.map(async (card) => {
          const result = await CreditCardService.getIntelligence(card.id)
          if (!result.success || !result.data) return null
          return result.data
        })
      )

      return intelligence.filter((i): i is CardIntelligence => i !== null)
    })
  },

  /**
   * Recomienda la mejor tarjeta para una compra: prioriza cupo disponible
   * suficiente, mayor plazo de financiación, y coincidencia de categoría de
   * beneficio o cashback.
   */
  async recommendForPurchase(amount: number, categoryTag?: string): Promise<ApiResult<CardRecommendation[]>> {
    return wrapService(async () => {
      if (!(amount > 0)) throw new Error('El monto de la compra debe ser mayor a 0')

      const intelligenceResult = await CreditCardService.getAllIntelligence()
      if (!intelligenceResult.success || !intelligenceResult.data) {
        throw new Error(intelligenceResult.error ?? 'No se pudo calcular la inteligencia de tarjetas')
      }

      const recommendations: CardRecommendation[] = intelligenceResult.data.map((card) => {
        const reasons: string[] = []
        const eligible = card.availableLimit >= amount

        if (!eligible) {
          reasons.push('Cupo disponible insuficiente para esta compra')
        }

        let score = 0

        // Días de financiación: a más días, mejor puntaje
        score += card.financingDaysIfPurchaseToday
        reasons.push(`Tendrás ${card.financingDaysIfPurchaseToday} días para pagar sin intereses`)

        if (card.status === 'EXCELLENT' || card.status === 'GOOD') {
          score += 20
          reasons.push('Es un buen momento del ciclo para comprar con esta tarjeta')
        }

        if (card.cashbackPercent > 0) {
          score += card.cashbackPercent * 10
          reasons.push(`Obtienes ${card.cashbackPercent}% de cashback`)
        }

        if (categoryTag && card.benefitCategories.includes(categoryTag)) {
          score += 30
          reasons.push(`Tiene beneficios especiales en la categoría "${categoryTag}"`)
        }

        if (!eligible) score = -1

        return {
          cardId: card.cardId,
          name: card.name,
          bank: card.bank,
          score,
          reasons,
          eligible
        }
      })

      return recommendations.sort((a, b) => b.score - a.score)
    })
  }
}
