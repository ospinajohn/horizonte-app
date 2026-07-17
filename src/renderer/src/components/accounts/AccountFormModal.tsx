import { useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import type { Account, AccountType, CreateAccountDto } from '../../../../shared/types'

const ACCOUNT_TYPES: AccountType[] = [
  'BANCO', 'EFECTIVO', 'NEQUI', 'DAVIPLATA', 'TARJETA', 'AHORROS', 'INVERSION'
]

const TYPE_LABELS: Record<AccountType, string> = {
  BANCO: 'Banco', EFECTIVO: 'Efectivo', NEQUI: 'Nequi',
  DAVIPLATA: 'Daviplata', TARJETA: 'Tarjeta', AHORROS: 'Ahorros', INVERSION: 'Inversión'
}

const PRESET_COLORS = [
  '#10B981', '#60A5FA', '#F59E0B', '#F43F5E',
  '#A78BFA', '#34D399', '#FB923C', '#E879F9'
]

const schema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  type: z.enum(['BANCO', 'EFECTIVO', 'NEQUI', 'DAVIPLATA', 'TARJETA', 'AHORROS', 'INVERSION']),
  initialBalance: z.coerce.number().min(0, 'El saldo inicial no puede ser negativo'),
  color: z.string().min(1, 'Selecciona un color'),
  isEmergencyFund: z.boolean().optional()
})

type FormValues = z.infer<typeof schema>

interface AccountFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  account?: Account | null
}

export function AccountFormModal({ open, onClose, onSuccess, account }: AccountFormModalProps): JSX.Element {
  const isEdit = !!account

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      type: 'BANCO',
      initialBalance: 0,
      color: '#10B981',
      isEmergencyFund: false
    }
  })

  useEffect(() => {
    if (open) {
      if (account) {
        reset({
          name: account.name,
          type: account.type,
          initialBalance: account.initialBalance,
          color: account.color,
          isEmergencyFund: account.isEmergencyFund
        })
      } else {
        reset({ name: '', type: 'BANCO', initialBalance: 0, color: '#10B981', isEmergencyFund: false })
      }
    }
  }, [open, account, reset])

  const selectedColor = watch('color')

  const onSubmit = async (values: FormValues): Promise<void> => {
    const dto: CreateAccountDto = {
      name: values.name,
      type: values.type,
      initialBalance: values.initialBalance,
      color: values.color,
      icon: values.type.toLowerCase(),
      isEmergencyFund: values.isEmergencyFund ?? false
    }

    let result
    if (isEdit && account) {
      result = await window.api.accounts.update(account.id, dto)
    } else {
      result = await window.api.accounts.create(dto)
    }

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
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#10B981] mb-1">
                {isEdit ? 'Editar' : 'Nueva'} Cuenta
              </p>
              <Dialog.Title className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white">
                {isEdit ? `Editar ${account?.name}` : 'Agregar cuenta'}
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
            {/* Name */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                Nombre
              </label>
              <Input {...register('name')} placeholder="Ej. Cuenta Bancolombia" />
              {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>}
            </div>

            {/* Type */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                Tipo de cuenta
              </label>
              <select
                {...register('type')}
                className="w-full h-10 rounded-2xl border border-white/5 bg-white/5 px-4 text-sm text-white focus:outline-none focus:border-[#10B981]/50"
              >
                {ACCOUNT_TYPES.map(t => (
                  <option key={t} value={t} className="bg-[#121418]">{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>

            {/* Initial Balance */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                Saldo inicial
              </label>
              <Input
                {...register('initialBalance')}
                type="number"
                min={0}
                step="0.01"
                placeholder="0"
                disabled={isEdit}
              />
              {isEdit && (
                <p className="text-[11px] text-gray-600 mt-1">El saldo inicial no se puede modificar.</p>
              )}
              {errors.initialBalance && <p className="text-xs text-rose-400 mt-1">{errors.initialBalance.message}</p>}
            </div>

            {/* Color */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setValue('color', c)}
                    className={cn(
                      'w-8 h-8 rounded-xl border-2 transition-all',
                      selectedColor === c ? 'border-white scale-110' : 'border-transparent'
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </div>

            {/* Emergency Fund */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  {...register('isEmergencyFund')}
                  type="checkbox"
                  className="peer sr-only"
                />
                <div className="w-10 h-5 rounded-full bg-white/10 peer-checked:bg-[#10B981]/80 transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
              </div>
              <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                Marcar como fondo de emergencia
              </span>
            </label>

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
                className="flex-1 h-10 rounded-2xl bg-[#10B981] text-black font-bold text-sm hover:bg-[#0ea371] transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear cuenta'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
