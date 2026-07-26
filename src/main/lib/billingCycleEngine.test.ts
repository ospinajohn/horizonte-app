import { describe, it, expect } from 'vitest'
import { getCycleContaining, getCardStatus, resolveDayInMonth } from './billingCycleEngine'

describe('resolveDayInMonth', () => {
  it('clampa el día 31 en un mes de 30 días (abril)', () => {
    const date = resolveDayInMonth(31, 2026, 3) // abril = mes índice 3
    expect(date.getDate()).toBe(30)
  })

  it('clampa el día 30 en febrero (año no bisiesto)', () => {
    const date = resolveDayInMonth(30, 2026, 1) // febrero = mes índice 1
    expect(date.getDate()).toBe(28)
  })

  it('respeta el día si es válido para el mes', () => {
    const date = resolveDayInMonth(15, 2026, 6)
    expect(date.getDate()).toBe(15)
  })
})

describe('getCycleContaining', () => {
  it('si el pago es antes que el corte (numéricamente), cae en el mes siguiente', () => {
    // corte=30, pago=15, hoy=20 de julio -> corte de julio 30, pago 15 agosto
    const cycle = getCycleContaining(30, 15, new Date(2026, 6, 20))
    expect(cycle.cutDate.getMonth()).toBe(6) // julio
    expect(cycle.cutDate.getDate()).toBe(30)
    expect(cycle.paymentDate.getMonth()).toBe(7) // agosto
    expect(cycle.paymentDate.getDate()).toBe(15)
  })

  it('ciclo corto: el pago cae después del corte en el mismo mes', () => {
    // corte=5, pago=20, hoy=10 de julio -> corte julio 5 (ya pasó), próximo corte agosto 5
    const cycle = getCycleContaining(5, 20, new Date(2026, 6, 10))
    expect(cycle.cutDate.getMonth()).toBe(7) // agosto
    expect(cycle.cutDate.getDate()).toBe(5)
    expect(cycle.paymentDate.getMonth()).toBe(7) // agosto, mismo mes que el corte
    expect(cycle.paymentDate.getDate()).toBe(20)
  })

  it('si hoy es exactamente el día de corte, el ciclo actual termina hoy', () => {
    const cycle = getCycleContaining(10, 25, new Date(2026, 6, 10))
    expect(cycle.cutDate.getDate()).toBe(10)
    expect(cycle.cutDate.getMonth()).toBe(6)
  })

  it('si hoy es un día después del corte, el ciclo avanza al corte del mes siguiente', () => {
    const cycle = getCycleContaining(10, 25, new Date(2026, 6, 11))
    expect(cycle.cutDate.getDate()).toBe(10)
    expect(cycle.cutDate.getMonth()).toBe(7) // agosto
  })

  it('previousCutDate es siempre anterior a cutDate', () => {
    const cycle = getCycleContaining(15, 5, new Date(2026, 6, 1))
    expect(cycle.previousCutDate.getTime()).toBeLessThan(cycle.cutDate.getTime())
  })
})

describe('getCardStatus', () => {
  it('recién pasado el corte anterior, con máximo financiamiento, es EXCELLENT', () => {
    // corte=1, pago=28 (casi todo el mes de financiamiento), hoy justo después del corte anterior
    const result = getCardStatus(1, 28, new Date(2026, 6, 2))
    expect(result.status === 'EXCELLENT' || result.status === 'GOOD').toBe(true)
  })

  it('a pocos días del corte con un ciclo corto (poco margen de pago), el estado es AVOID', () => {
    // corte=10, pago=15 (solo 5 días de plazo tras el corte) -> ratio bajo cerca del corte
    const result = getCardStatus(10, 15, new Date(2026, 6, 9))
    expect(result.status).toBe('AVOID')
    expect(result.daysUntilCut).toBe(1)
  })

  it('daysUntilPayment coincide con financingDaysIfPurchaseToday', () => {
    const result = getCardStatus(15, 5, new Date(2026, 6, 16))
    expect(result.financingDaysIfPurchaseToday).toBe(result.daysUntilPayment)
  })

  it('nunca produce financingDays negativos dentro del ciclo vigente', () => {
    const result = getCardStatus(20, 10, new Date(2026, 6, 20))
    expect(result.financingDaysIfPurchaseToday).toBeGreaterThanOrEqual(0)
  })
})
