import { getPrismaClient } from '../database/client'
import type { DebtCapacityData, ApiResult } from '../../shared/types'
import { CreditCardService } from './CreditCardService'

const db = () => getPrismaClient()

export const DebtCapacityService = {
  async getData(): Promise<ApiResult<DebtCapacityData>> {
    try {
      const prisma = db()

      // Ingresos promedio de los últimos 3 meses
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

      const incomeAgg = await prisma.transaction.aggregate({
        where: { type: 'INCOME', date: { gte: threeMonthsAgo } },
        _sum: { amount: true }
      })
      const monthlyIncome = (incomeAgg._sum.amount ?? 0) / 3

      // Créditos activos
      const credits = await prisma.credit.findMany({ where: { isActive: true, status: 'ACTIVE' } })
      const creditDetails = credits.map((c) => ({
        name: c.entityName,
        monthlyPayment: c.monthlyPayment
      }))
      const totalCreditPayments = credits.reduce((sum, c) => sum + c.monthlyPayment, 0)

      // Tarjetas de crédito — pago mínimo estimado (5% del saldo usado)
      const cards = await prisma.creditCard.findMany({
        where: { isActive: true },
        include: { purchases: true }
      })
      const currentPeriod = CreditCardService.getCurrentBillingPeriod()

      const cardDetails = cards.map((card) => {
        const periodPurchases = card.purchases.filter((p) => p.billingPeriod === currentPeriod)
        const usedAmount = periodPurchases.reduce((s, p) => s + p.amount, 0)
        const minimumPayment = usedAmount * 0.05
        return { name: `${card.name} (${card.bank})`, minimumPayment }
      }).filter((c) => c.minimumPayment > 0)

      const totalCardPayments = cardDetails.reduce((sum, c) => sum + c.minimumPayment, 0)

      const totalMonthlyDebt = totalCreditPayments + totalCardPayments

      const debtRatioPercent = monthlyIncome > 0
        ? (totalMonthlyDebt / monthlyIncome) * 100
        : 0

      const maxRecommendedPayment = monthlyIncome * 0.30
      const availableCapacity = Math.max(maxRecommendedPayment - totalMonthlyDebt, 0)

      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'
      if (debtRatioPercent >= 40) riskLevel = 'HIGH'
      else if (debtRatioPercent >= 30) riskLevel = 'MEDIUM'

      return {
        success: true,
        data: {
          monthlyIncome: Math.round(monthlyIncome),
          totalMonthlyDebt: Math.round(totalMonthlyDebt),
          debtRatioPercent: Math.round(debtRatioPercent * 10) / 10,
          maxRecommendedPayment: Math.round(maxRecommendedPayment),
          availableCapacity: Math.round(availableCapacity),
          riskLevel,
          creditDetails,
          cardDetails
        }
      }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }
}
