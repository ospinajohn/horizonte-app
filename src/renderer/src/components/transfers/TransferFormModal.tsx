import { useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { cn, formatCurrency } from '@/lib/utils'
import { Input, DatePicker } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useAccounts } from '@/hooks/useAccounts'
import type { CreateTransferDto } from '../../../../shared/types'

interface TransferFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const schema = z.object({
  fromAccountId: z.coerce.number().min(1, 'Selecciona la cuenta origen'),
  toAccountId: z.coerce.number().min(1, 'Selecciona la cuenta destino'),
  amount: z.coerce.number().min(0.01, 'El monto debe ser mayor a 0'),
  date: z.string().min(1, 'La fecha es requerida'),
  description: z.string().optional()
}).refine(d => d.fromAccountId !== d.toAccountId, {
  message: 'Las cuentas origen y destino deben ser diferentes',
  path: ['toAccountId']
})

type FormValues = z.infer<typeof schema>

export function TransferFormModal({ open, onClose, onSuccess }: TransferFormModalProps): JSX.Element {
  const { accounts } = useAccounts()

  const { register, handleSubmit, control, watch, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fromAccountId: undefined,
      toAccountId: undefined,
      amount: 0,
      date: format(new Date(), 'yyyy-MM-dd'),
      description: ''
    }
  })

  useEffect(() => {
    if (open) {
      reset({
        fromAccountId: accounts[0]?.id,
        toAccountId: accounts[1]?.id,
        amount: 0,
        date: format(new Date(), 'yyyy-MM-dd'),
        description: ''
      })
    }
  }, [open, accounts, reset])

  const fromAccountId = watch('fromAccountId')
  const selectedFrom = accounts.find(a => a.id === Number(fromAccountId))
  const fromBalance = selectedFrom ? (selectedFrom.currentBalance ?? selectedFrom.initialBalance) : 0

  const onSubmit = async (values: FormValues): Promise<void> => {
    const dto: CreateTransferDto = {
      fromAccountId: values.fromAccountId,
      toAccountId: values.toAccountId,
      amount: values.amount,
      date: new Date(values.date),
      description: values.description || undefined
    }

    const result = await window.api.transfers.create(dto)
    if (result.success) {
      onSuccess()
      onClose()
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-[#121418] border border-white/5 rounded-[28px] p-8 shadow-xl focus:outline-none">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">
                Nueva Transferencia
              </p>
              <Dialog.Title className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white">
                Transferir fondos
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Accounts — visual flow */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Origen
                </label>
                <Controller
                  name="fromAccountId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value != null ? String(field.value) : ''}
                      onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map(a => (
                          <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.fromAccountId && <p className="text-xs text-rose-400 mt-1">{errors.fromAccountId.message}</p>}
              </div>

              <div className="shrink-0 mt-5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <ArrowRight size={16} className="text-blue-400" />
                </div>
              </div>

              <div className="flex-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Destino
                </label>
                <Controller
                  name="toAccountId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value != null ? String(field.value) : ''}
                      onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts
                          .filter(a => a.id !== Number(fromAccountId))
                          .map(a => (
                            <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.toAccountId && <p className="text-xs text-rose-400 mt-1">{errors.toAccountId.message}</p>}
              </div>
            </div>

            {/* Available balance indicator */}
            {selectedFrom && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Saldo disponible:</span>
                <span className={cn(
                  'text-sm font-bold font-mono',
                  fromBalance < 0 ? 'text-rose-400' : 'text-[#10B981]'
                )}>
                  {formatCurrency(fromBalance)}
                </span>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                Monto
              </label>
              <Input {...register('amount')} type="number" min={0} step="0.01" placeholder="0" />
              {errors.amount && <p className="text-xs text-rose-400 mt-1">{errors.amount.message}</p>}
            </div>

            {/* Date */}
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
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                Descripción <span className="text-gray-700 normal-case tracking-normal">(opcional)</span>
              </label>
              <Input {...register('description')} placeholder="Ej. Traslado mensual" />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-10 rounded-2xl border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-10 rounded-2xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-600 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Procesando...' : 'Transferir'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
