import { getPrismaClient } from '../database/client'
import type { Credit, AmortizationRow, CreateCreditDto, ApiResult } from '../../shared/types'

const db = () => getPrismaClient()

export const CreditService = {
  /**
   * Genera la tabla de amortización sistema francés (cuota fija)
   * r = (1 + annualRate/100)^(1/12) - 1
   * cuota = P * r * (1+r)^n / ((1+r)^n - 1)
   */
  generateAmortization(
    pendingAmount: number,
    annualRate: number,
    totalInstallments: number,
    paidInstallments: number,
    startDate: Date,
    paymentDay: number
  ): Array<Omit<AmortizationRow, 'id' | 'creditId'>> {
    const r = Math.pow(1 + annualRate / 100, 1 / 12) - 1
    let cuota: number

    if (r === 0) {
      cuota = pendingAmount / totalInstallments
    } else {
      const factor = Math.pow(1 + r, totalInstallments)
      cuota = (pendingAmount * r * factor) / (factor - 1)
    }

    const rows: Array<Omit<AmortizationRow, 'id' | 'creditId'>> = []
    let balance = pendingAmount

    for (let i = 1; i <= totalInstallments; i++) {
      const interest = balance * r
      const principal = cuota - interest
      balance = Math.max(balance - principal, 0)

      // Calcular fecha de vencimiento
      const dueDate = new Date(startDate)
      dueDate.setMonth(dueDate.getMonth() + i)
      dueDate.setDate(paymentDay)

      rows.push({
        installment: i,
        payment: Math.round(cuota * 100) / 100,
        principal: Math.round(principal * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        balance: Math.round(balance * 100) / 100,
        dueDate,
        isPaid: i <= paidInstallments
      })
    }

    return rows
  },

  async getAll(): Promise<ApiResult<Credit[]>> {
    try {
      const credits = await db().credit.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      })
      return { success: true, data: credits as Credit[] }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async getById(id: number): Promise<ApiResult<Credit>> {
    try {
      const credit = await db().credit.findUnique({
        where: { id },
        include: { amortizationRows: { orderBy: { installment: 'asc' } } }
      })
      if (!credit) return { success: false, error: 'Crédito no encontrado' }
      return { success: true, data: credit as Credit }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async create(dto: CreateCreditDto): Promise<ApiResult<Credit>> {
    try {
      const paidInstallments = dto.paidInstallments ?? 0
      const startDate = new Date(dto.startDate)

      // Calcular cuota mensual si no se proporcionó
      const r = Math.pow(1 + dto.annualRate / 100, 1 / 12) - 1
      let monthlyPayment = dto.monthlyPayment
      if (!monthlyPayment || monthlyPayment === 0) {
        if (r === 0) {
          monthlyPayment = dto.totalAmount / dto.totalInstallments
        } else {
          const factor = Math.pow(1 + r, dto.totalInstallments)
          monthlyPayment = (dto.pendingAmount * r * factor) / (factor - 1)
        }
      }

      // Crear el crédito y su amortización en una transacción
      const credit = await db().$transaction(async (tx) => {
        // 1. Crear crédito
        const newCredit = await tx.credit.create({
          data: {
            entityName: dto.entityName,
            totalAmount: dto.totalAmount,
            pendingAmount: dto.pendingAmount,
            annualRate: dto.annualRate,
            monthlyPayment: Math.round(monthlyPayment * 100) / 100,
            paymentDay: dto.paymentDay,
            totalInstallments: dto.totalInstallments,
            paidInstallments,
            status: dto.status ?? 'ACTIVE',
            startDate,
            notes: dto.notes ?? null
          }
        })

        // 2. Generar filas de amortización
        const rows = CreditService.generateAmortization(
          dto.pendingAmount,
          dto.annualRate,
          dto.totalInstallments,
          paidInstallments,
          startDate,
          dto.paymentDay
        )

        // 3. Insertar filas
        await tx.amortizationRow.createMany({
          data: rows.map((row) => ({ ...row, creditId: newCredit.id }))
        })

        // 4. Crear RecurringItem para la cuota mensual
        const nextPayDate = new Date()
        nextPayDate.setDate(dto.paymentDay)
        if (nextPayDate < new Date()) {
          nextPayDate.setMonth(nextPayDate.getMonth() + 1)
        }

        const recurringItem = await tx.recurringItem.create({
          data: {
            name: `Cuota ${dto.entityName}`,
            type: 'PAYMENT',
            amount: Math.round(monthlyPayment * 100) / 100,
            recurrence: 'MONTHLY',
            nextDate: nextPayDate,
            description: `Cuota mensual crédito ${dto.entityName}`,
            isActive: true
          }
        })

        // 5. Vincular RecurringItem al crédito
        const updatedCredit = await tx.credit.update({
          where: { id: newCredit.id },
          data: { recurringItemId: recurringItem.id }
        })

        return updatedCredit
      })

      return { success: true, data: credit as Credit }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async update(id: number, dto: Partial<CreateCreditDto>): Promise<ApiResult<Credit>> {
    try {
      const data: any = { ...dto }
      if (dto.startDate) data.startDate = new Date(dto.startDate)
      const credit = await db().credit.update({
        where: { id },
        data
      })
      return { success: true, data: credit as Credit }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async delete(id: number): Promise<ApiResult<void>> {
    try {
      await db().credit.update({ where: { id }, data: { isActive: false } })
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }
}
