import { z } from 'zod'

/**
 * Schemas de validación de servidor (main process) para los DTOs que llegan por IPC.
 * Espejan las reglas de los formularios del renderer, pero se aplican de nuevo aquí
 * porque un renderer comprometido podría invocar window.api.* sin pasar por el formulario.
 */

export const createAccountSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  type: z.enum(['BANCO', 'EFECTIVO', 'NEQUI', 'DAVIPLATA', 'TARJETA', 'AHORROS', 'INVERSION']),
  initialBalance: z.number().min(0, 'El saldo inicial no puede ser negativo'),
  color: z.string().min(1, 'Selecciona un color'),
  icon: z.string().min(1, 'Falta el icono de la cuenta'),
  isEmergencyFund: z.boolean().optional()
})

export const updateAccountSchema = createAccountSchema.partial().extend({
  isActive: z.boolean().optional()
})

export const createTransactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER_IN', 'TRANSFER_OUT']),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  date: z.coerce.date(),
  description: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  receiptPath: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'DEBIT', 'CREDIT', 'TRANSFER']).optional(),
  accountId: z.number().int().positive('Selecciona una cuenta'),
  categoryId: z.number().int().positive().optional(),
  recurringItemId: z.number().int().positive().optional(),
  isRecurring: z.boolean().optional()
})

export const updateTransactionSchema = createTransactionSchema.partial()

export const createBudgetSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  period: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  categories: z
    .array(
      z.object({
        categoryId: z.number().int().positive('Selecciona una categoría'),
        limit: z.number().positive('Debe ser mayor a 0')
      })
    )
    .min(1, 'Agrega al menos una categoría al presupuesto')
})

export const createSavingsGoalSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  targetAmount: z.number().positive('El monto objetivo debe ser mayor a 0'),
  currentAmount: z.number().min(0).optional(),
  deadline: z.coerce.date().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  monthlyTarget: z.number().min(0).optional(),
  accountId: z.number().int().positive().optional()
})

export const updateSavingsGoalSchema = createSavingsGoalSchema.partial()

export const createCreditCardSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  bank: z.string().min(1, 'El banco es obligatorio'),
  totalLimit: z.number().positive('El cupo total debe ser mayor a 0'),
  cutDay: z.number().int().min(1).max(31),
  paymentDay: z.number().int().min(1).max(31),
  annualRate: z.number().min(0).optional(),
  color: z.string().optional(),
  franchise: z.string().optional(),
  cashbackPercent: z.number().min(0).max(100).optional(),
  benefitTypes: z.array(z.enum(['CASHBACK', 'MILES', 'POINTS', 'DISCOUNTS'])).optional(),
  benefitCategories: z.array(z.string()).optional()
})

export const updateCreditCardSchema = createCreditCardSchema.partial()

export const createSavingsContributionSchema = z.object({
  goalId: z.number().int().positive(),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  date: z.coerce.date().optional(),
  notes: z.string().optional(),
  isAutomatic: z.boolean().optional()
})

/** Lanza un Error con el primer mensaje de validación si el DTO no cumple el schema. */
export function validateDto<T>(schema: z.ZodType<T>, dto: unknown): T {
  const result = schema.safeParse(dto)
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? 'Datos inválidos')
  }
  return result.data
}
