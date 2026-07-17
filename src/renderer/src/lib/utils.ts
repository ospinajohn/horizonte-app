import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

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
