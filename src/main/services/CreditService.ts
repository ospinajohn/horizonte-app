import { getPrismaClient } from '../database/client'
import type { Credit, AmortizationRow, CreateCreditDto, ApiResult } from '../../shared/types'

const db = () => getPrismaClient()

export const CreditService = {
  /**
   * Calcula la cuota mensual teórica sistema francés (cuota fija)
   * r = (1 + annualRate/100)^(1/12) - 1
   * cuota = P * r * (1+r)^n / ((1+r)^n - 1)
   */
  calculateMonthlyPayment(pendingAmount: number, annualRate: number, totalInstallments: number): number {
    const r = Math.pow(1 + annualRate / 100, 1 / 12) - 1
    if (r === 0) return pendingAmount / totalInstallments
    const factor = Math.pow(1 + r, totalInstallments)
    return (pendingAmount * r * factor) / (factor - 1)
  },

  /**
   * Genera la tabla de amortización usando la cuota real (`payment`), manual o calculada.
   * Si la cuota no alcanza a cubrir el interés del período, el saldo deja de amortizar
   * (se mantiene, sin bajar) en vez de crecer indefinidamente.
   */
  generateAmortization(
    pendingAmount: number,
    annualRate: number,
    totalInstallments: number,
    paidInstallments: number,
    startDate: Date,
    paymentDay: number,
    payment: number
  ): Array<Omit<AmortizationRow, 'id' | 'creditId'>> {
    const r = Math.pow(1 + annualRate / 100, 1 / 12) - 1
    const cuota = payment

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

      // Usar la cuota manual si el usuario la indicó; si no, calcularla
      let monthlyPayment = dto.monthlyPayment
      if (!monthlyPayment || monthlyPayment === 0) {
        monthlyPayment = CreditService.calculateMonthlyPayment(
          dto.pendingAmount,
          dto.annualRate,
          dto.totalInstallments
        )
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

        // 2. Generar filas de amortización con la cuota real (manual o calculada)
        const rows = CreditService.generateAmortization(
          dto.pendingAmount,
          dto.annualRate,
          dto.totalInstallments,
          paidInstallments,
          startDate,
          dto.paymentDay,
          Math.round(monthlyPayment * 100) / 100
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
      const existing = await db().credit.findUnique({ where: { id } })
      if (!existing) return { success: false, error: 'Crédito no encontrado' }

      const startDate = dto.startDate ? new Date(dto.startDate) : existing.startDate
      const pendingAmount = dto.pendingAmount ?? existing.pendingAmount
      const annualRate = dto.annualRate ?? existing.annualRate
      const totalInstallments = dto.totalInstallments ?? existing.totalInstallments
      const paidInstallments = dto.paidInstallments ?? existing.paidInstallments
      const paymentDay = dto.paymentDay ?? existing.paymentDay

      // Usar la cuota manual si el usuario la indicó; si no, calcularla
      let monthlyPayment = dto.monthlyPayment
      if (!monthlyPayment || monthlyPayment === 0) {
        monthlyPayment = CreditService.calculateMonthlyPayment(pendingAmount, annualRate, totalInstallments)
      }
      monthlyPayment = Math.round(monthlyPayment * 100) / 100

      const credit = await db().$transaction(async (tx) => {
        const updated = await tx.credit.update({
          where: { id },
          data: {
            entityName: dto.entityName ?? existing.entityName,
            totalAmount: dto.totalAmount ?? existing.totalAmount,
            pendingAmount,
            annualRate,
            monthlyPayment,
            paymentDay,
            totalInstallments,
            paidInstallments,
            status: dto.status ?? existing.status,
            startDate,
            notes: dto.notes ?? existing.notes
          }
        })

        // Regenerar tabla de amortización con los datos actualizados
        await tx.amortizationRow.deleteMany({ where: { creditId: id } })
        const rows = CreditService.generateAmortization(
          pendingAmount,
          annualRate,
          totalInstallments,
          paidInstallments,
          startDate,
          paymentDay,
          monthlyPayment
        )
        await tx.amortizationRow.createMany({
          data: rows.map((row) => ({ ...row, creditId: id }))
        })

        // Sincronizar la cuota del RecurringItem vinculado
        if (existing.recurringItemId) {
          await tx.recurringItem.update({
            where: { id: existing.recurringItemId },
            data: { amount: monthlyPayment, name: `Cuota ${updated.entityName}` }
          })
        }

        return updated
      })

      return { success: true, data: credit as Credit }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async delete(id: number): Promise<ApiResult<void>> {
    try {
      await db().$transaction(async (tx) => {
        const credit = await tx.credit.update({ where: { id }, data: { isActive: false } })
        if (credit.recurringItemId) {
          await tx.recurringItem.update({
            where: { id: credit.recurringItemId },
            data: { isActive: false }
          })
        }
      })
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }
}
