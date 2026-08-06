/**
 * Motor de ciclos de facturación de tarjetas de crédito.
 *
 * En vez de comparar dos números de día del mes con reglas ad hoc, genera
 * ciclos explícitos (corte → pago) a partir de cutDay/paymentDay, igual que
 * lo haría un sistema bancario. Puro (sin Prisma) para ser 100% testeable.
 */

export type CardStatus = 'EXCELLENT' | 'GOOD' | 'NORMAL' | 'AVOID'

export interface BillingCycle {
  previousCutDate: Date
  cutDate: Date
  paymentDate: Date
  periodKey: string
}

export interface CardStatusResult {
  status: CardStatus
  daysUntilCut: number
  daysUntilPayment: number
  financingDaysIfPurchaseToday: number
  cycle: BillingCycle
}

function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(year, monthIndex0 + 1, 0).getDate()
}

/** Clampa `day` al último día real del mes (ej. día 31 en abril -> 30). */
export function resolveDayInMonth(day: number, year: number, monthIndex0: number): Date {
  const clamped = Math.min(Math.max(day, 1), daysInMonth(year, monthIndex0))
  return new Date(year, monthIndex0, clamped, 0, 0, 0, 0)
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
}

function diffDays(a: Date, b: Date): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / MS_PER_DAY)
}

function periodKeyFor(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Encuentra el ciclo de facturación que contiene `referenceDate`, es decir
 * previousCutDate < referenceDate <= cutDate. Una compra en `referenceDate`
 * pertenece a este ciclo y se paga en `paymentDate`.
 */
export function getCycleContaining(
  cutDay: number,
  paymentDay: number,
  referenceDate: Date = new Date()
): BillingCycle {
  const ref = startOfDay(referenceDate)

  const thisMonthCut = resolveDayInMonth(cutDay, ref.getFullYear(), ref.getMonth())

  let cutDate: Date
  if (ref <= thisMonthCut) {
    cutDate = thisMonthCut
  } else {
    const nextMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 1)
    cutDate = resolveDayInMonth(cutDay, nextMonth.getFullYear(), nextMonth.getMonth())
  }

  const prevMonth = new Date(cutDate.getFullYear(), cutDate.getMonth() - 1, 1)
  const previousCutDate = resolveDayInMonth(cutDay, prevMonth.getFullYear(), prevMonth.getMonth())

  // Fecha de pago: día `paymentDay` en el mes del corte; si cae antes o el
  // mismo día del corte, se traslada al mes siguiente (no se asume siempre
  // "+1 mes": esto soporta también ciclos cortos donde el pago cae después
  // del corte dentro del mismo mes).
  let paymentDate = resolveDayInMonth(paymentDay, cutDate.getFullYear(), cutDate.getMonth())
  if (paymentDate <= cutDate) {
    const nextMonth = new Date(cutDate.getFullYear(), cutDate.getMonth() + 1, 1)
    paymentDate = resolveDayInMonth(paymentDay, nextMonth.getFullYear(), nextMonth.getMonth())
  }

  return { previousCutDate, cutDate, paymentDate, periodKey: periodKeyFor(cutDate) }
}

/**
 * Clasifica el momento actual para comprar con esta tarjeta, en función de
 * cuánto financiamiento (días hasta el pago) tendría una compra hecha hoy,
 * relativo al financiamiento máximo posible del ciclo (comprar justo después
 * del corte anterior).
 */
export function getCardStatus(
  cutDay: number,
  paymentDay: number,
  referenceDate: Date = new Date()
): CardStatusResult {
  const ref = startOfDay(referenceDate)
  const cycle = getCycleContaining(cutDay, paymentDay, ref)

  const daysUntilCut = diffDays(cycle.cutDate, ref)
  const daysUntilPayment = diffDays(cycle.paymentDate, ref)
  const financingDaysIfPurchaseToday = daysUntilPayment

  const maxFinancingDays = diffDays(cycle.paymentDate, cycle.previousCutDate)
  const ratio = maxFinancingDays > 0 ? financingDaysIfPurchaseToday / maxFinancingDays : 0

  let status: CardStatus
  if (ratio >= 0.9) status = 'EXCELLENT'
  else if (ratio >= 0.6) status = 'GOOD'
  else if (ratio >= 0.3) status = 'NORMAL'
  else status = 'AVOID'

  return { status, daysUntilCut, daysUntilPayment, financingDaysIfPurchaseToday, cycle }
}
