import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { format } from 'date-fns'
import { Input, DatePicker } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatCurrency, parseLocalDate } from '@/lib/utils'
import type { SavingsGoal } from '../../../../shared/types'

const contributionSchema = z.object({
  amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
  date: z.string().min(1, 'La fecha es requerida'),
  notes: z.string().optional()
})

type ContributionFormValues = z.infer<typeof contributionSchema>

interface ContributionModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  goal: SavingsGoal | null
}

export function ContributionModal({ open, onClose, onSuccess, goal }: ContributionModalProps): JSX.Element {
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } =
    useForm<ContributionFormValues>({
      resolver: zodResolver(contributionSchema),
      defaultValues: {
        amount: 0,
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: ''
      }
    })

  useEffect(() => {
    if (open) {
      reset({
        amount: 0,
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: ''
      })
      setError(null)
    }
  }, [open, reset])

  if (!goal) return <></>

  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0)

  const onSubmit = async (values: ContributionFormValues): Promise<void> => {
    setError(null)
    try {
      const result = await window.api.goals.addContribution({
        goalId: goal.id,
        amount: values.amount,
        date: parseLocalDate(values.date),
        notes: values.notes || undefined
      })

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.error ?? 'Error al registrar el aporte')
      }
    } catch {
      setError('Error inesperado al registrar el aporte')
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-[#121418] border border-white/5 rounded-[28px] shadow-2xl focus:outline-none">
          {/* Header */}
          <div className="flex items-center justify-between p-8 border-b border-white/5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#10B981] mb-1">
                Agregar Aporte
              </p>
              <Dialog.Title className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white">
                {goal.name}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition-all"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          {/* Balance info */}
          <div className="mx-8 mt-6 p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Ahorrado</p>
              <p className="text-sm font-bold text-[#10B981]">{formatCurrency(goal.currentAmount)}</p>
            </div>
            <div className="h-8 w-px bg-white/5" />
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Faltante</p>
              <p className="text-sm font-bold text-rose-400">{formatCurrency(remaining)}</p>
            </div>
            <div className="h-8 w-px bg-white/5" />
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Objetivo</p>
              <p className="text-sm font-bold text-gray-300">{formatCurrency(goal.targetAmount)}</p>
            </div>
          </div>

          {/* Form */}
          <div className="p-8 space-y-5">
            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm">
                {error}
              </div>
            )}

            {/* Monto */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                Monto del aporte
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                <Input
                  {...register('amount')}
                  type="number"
                  min={1}
                  placeholder="0"
                  className="pl-8"
                  autoFocus
                />
              </div>
              {errors.amount && (
                <p className="text-xs text-rose-400 mt-1">{errors.amount.message}</p>
              )}
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                Fecha
              </label>
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value ? new Date(field.value + 'T00:00:00') : null}
                    onChange={(d) => field.onChange(d ? format(d, 'yyyy-MM-dd') : '')}
                  />
                )}
              />
              {errors.date && (
                <p className="text-xs text-rose-400 mt-1">{errors.date.message}</p>
              )}
            </div>

            {/* Notas */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                Notas (opcional)
              </label>
              <Input {...register('notes')} placeholder="Ej. Bono de fin de año" />
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 pb-8 flex justify-end gap-3">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit(onSubmit)}
            >
              {isSubmitting ? 'Guardando...' : 'Registrar aporte'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
