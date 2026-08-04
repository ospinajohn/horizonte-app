import { describe, it, expect } from 'vitest'
import { CreditService } from './CreditService'

describe('CreditService.generateAmortization', () => {
  it('genera una fila por cada cuota y agota el saldo al final', () => {
    const pendingAmount = 10_000_000
    const annualRate = 24
    const totalInstallments = 12
    const payment = CreditService.calculateMonthlyPayment(pendingAmount, annualRate, totalInstallments)

    const rows = CreditService.generateAmortization(
      pendingAmount,
      annualRate,
      totalInstallments,
      0,
      new Date('2026-01-01'),
      5,
      payment
    )

    expect(rows).toHaveLength(12)
    expect(rows[rows.length - 1].balance).toBe(0)
  })

  it('mantiene la cuota mensual constante (sistema francés)', () => {
    const payment = CreditService.calculateMonthlyPayment(5_000_000, 18, 6)
    const rows = CreditService.generateAmortization(5_000_000, 18, 6, 0, new Date('2026-01-01'), 10, payment)
    const payments = new Set(rows.map((r) => r.payment))
    expect(payments.size).toBe(1)
  })

  it('con tasa 0 divide el capital en partes iguales', () => {
    const payment = CreditService.calculateMonthlyPayment(1_200_000, 0, 12)
    const rows = CreditService.generateAmortization(1_200_000, 0, 12, 0, new Date('2026-01-01'), 1, payment)
    expect(rows[0].payment).toBeCloseTo(100_000, 2)
    expect(rows.every((r) => r.interest === 0)).toBe(true)
  })

  it('marca como pagadas solo las cuotas ya cubiertas', () => {
    const payment = CreditService.calculateMonthlyPayment(3_000_000, 20, 10)
    const rows = CreditService.generateAmortization(3_000_000, 20, 10, 4, new Date('2026-01-01'), 15, payment)
    expect(rows.slice(0, 4).every((r) => r.isPaid)).toBe(true)
    expect(rows.slice(4).every((r) => !r.isPaid)).toBe(true)
  })

  it('el saldo nunca es negativo', () => {
    const payment = CreditService.calculateMonthlyPayment(500_000, 35, 3)
    const rows = CreditService.generateAmortization(500_000, 35, 3, 0, new Date('2026-01-01'), 20, payment)
    expect(rows.every((r) => r.balance >= 0)).toBe(true)
  })

  it('respeta una cuota manual aunque no coincida con la teórica', () => {
    const rows = CreditService.generateAmortization(9_000_000, 15, 12, 0, new Date('2026-01-01'), 5, 900_000)
    expect(rows.every((r) => r.payment === 900_000)).toBe(true)
  })
})
