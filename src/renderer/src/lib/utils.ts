import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
export type { Quincena } from '../../../shared/types'
import type { Quincena } from '../../../shared/types'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Formatea un valor numérico como moneda colombiana (COP)
 */
export function formatCurrency(value: number, currency = 'COP'): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

/**
 * Parsea un string 'yyyy-MM-dd' a Date en hora local (medianoche local),
 * evitando que new Date('2026-07-15') se interprete como UTC midnight
 * y cause un desfase de -1 día en zonas como UTC-5.
 */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Formatea un valor numérico como porcentaje
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Retorna clase de color según si el valor es positivo o negativo
 */
export function getValueColorClass(value: number): string {
  if (value > 0) return 'text-positive'
  if (value < 0) return 'text-negative'
  return 'text-neutral'
}

/**
 * Retorna el signo + o - para mostrar junto a un valor
 */
export function formatDelta(value: number, currency = 'COP'): string {
  const formatted = formatCurrency(Math.abs(value), currency)
  if (value > 0) return `+${formatted}`
  if (value < 0) return `-${formatted}`
  return formatted
}

/**
 * Retorna a qué quincena pertenece una fecha: días 1-15 = Q1, resto = Q2.
 */
export function getQuincena(date: Date): Quincena {
  return date.getDate() <= 15 ? 'Q1' : 'Q2'
}

/**
 * Retorna el rango [start, end] de la quincena indicada, en el mes/año de `date`.
 * Q1: día 1 al 15. Q2: día 16 al último día del mes.
 */
export function getQuincenaRange(date: Date, quincena: Quincena): { start: Date; end: Date } {
  const year = date.getFullYear()
  const month = date.getMonth()
  if (quincena === 'Q1') {
    return { start: new Date(year, month, 1), end: new Date(year, month, 15, 23, 59, 59, 999) }
  }
  const lastDay = new Date(year, month + 1, 0).getDate()
  return { start: new Date(year, month, 16), end: new Date(year, month, lastDay, 23, 59, 59, 999) }
}
