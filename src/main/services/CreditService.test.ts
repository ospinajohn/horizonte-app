import { describe, it, expect } from 'vitest'
import { CreditService } from './CreditService'

describe('CreditService.generateAmortization', () => {
  it('genera una fila por cada cuota y agota el saldo al final', () => {
    const rows = CreditService.generateAmortization(
      10_000_000,
      24, // tasa anual %
      12,
      0,
      new Date('2026-01-01'),
      5
    )

    expect(rows).toHaveLength(12)
    expect(rows[rows.length - 1].balance).toBe(0)
  })

  it('mantiene la cuota mensual constante (sistema francés)', () => {
    const rows = CreditService.generateAmortization(5_000_000, 18, 6, 0, new Date('2026-01-01'), 10)
    const payments = new Set(rows.map((r) => r.payment))
    expect(payments.size).toBe(1)
  })

  it('con tasa 0 divide el capital en partes iguales', () => {
    const rows = CreditService.generateAmortization(1_200_000, 0, 12, 0, new Date('2026-01-01'), 1)
    expect(rows[0].payment).toBeCloseTo(100_000, 2)
    expect(rows.every((r) => r.interest === 0)).toBe(true)
  })

  it('marca como pagadas solo las cuotas ya cubiertas', () => {
    const rows = CreditService.generateAmortization(3_000_000, 20, 10, 4, new Date('2026-01-01'), 15)
    expect(rows.slice(0, 4).every((r) => r.isPaid)).toBe(true)
    expect(rows.slice(4).every((r) => !r.isPaid)).toBe(true)
  })

  it('el saldo nunca es negativo', () => {
    const rows = CreditService.generateAmortization(500_000, 35, 3, 0, new Date('2026-01-01'), 20)
    expect(rows.every((r) => r.balance >= 0)).toBe(true)
  })
})
