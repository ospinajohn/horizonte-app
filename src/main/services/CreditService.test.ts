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

  it('solo genera las cuotas restantes, numeradas desde paidInstallments+1, sin fabricar filas ya pagadas', () => {
    const payment = CreditService.calculateMonthlyPayment(3_000_000, 20, 10)
    const rows = CreditService.generateAmortization(3_000_000, 20, 10, 4, new Date('2026-01-01'), 15, payment)
    expect(rows).toHaveLength(6)
    expect(rows[0].installment).toBe(5)
    expect(rows[rows.length - 1].installment).toBe(10)
    expect(rows.every((r) => !r.isPaid)).toBe(true)
  })

  it('el saldo nunca es negativo', () => {
    const payment = CreditService.calculateMonthlyPayment(500_000, 35, 3)
    const rows = CreditService.generateAmortization(500_000, 35, 3, 0, new Date('2026-01-01'), 20, payment)
    expect(rows.every((r) => r.balance >= 0)).toBe(true)
  })

  it('respeta una cuota manual aunque no coincida con la teórica', () => {
    // Teórica ≈ 808.329 — con 700.000 (menor) el saldo no se termina antes de las 12 cuotas
    const rows = CreditService.generateAmortization(9_000_000, 15, 12, 0, new Date('2026-01-01'), 5, 700_000)
    expect(rows).toHaveLength(12)
    expect(rows.every((r) => r.payment === 700_000)).toBe(true)
  })

  it('si la cuota manual sobrepaga, corta la tabla sin generar cuotas fantasma', () => {
    // Teórica ≈ 808.329 — con 900.000 (mayor) el saldo se paga antes de las 12 cuotas
    const rows = CreditService.generateAmortization(9_000_000, 15, 12, 0, new Date('2026-01-01'), 5, 900_000)
    expect(rows.length).toBeLessThan(12)
    expect(rows[rows.length - 1].balance).toBe(0)
    // Ninguna fila debe tener interés 0 con capital == cuota completa (cuota fantasma)
    expect(rows.every((r) => r.interest > 0)).toBe(true)
    // La última cuota real cubre exactamente lo que falta, no la cuota fija completa
    const last = rows[rows.length - 1]
    expect(last.payment).toBeCloseTo(last.principal + last.interest, 2)
  })
})
