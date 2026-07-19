import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { format } from 'date-fns'
import { Input, DatePicker } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useAccounts } from '@/hooks/useAccounts'
import type { SavingsGoal } from '../../../../shared/types'

const PRESET_COLORS = [
  '#10B981', '#60A5FA', '#F59E0B', '#F43F5E',
  '#A78BFA', '#34D399', '#FB923C', '#E879F9'
]

const ICON_OPTIONS = [
  { value: 'target', label: '🎯 Meta' },
  { value: 'plane', label: '✈️ Viaje' },
  { value: 'home', label: '🏠 Casa' },
  { value: 'shield', label: '🛡️ Emergencia' },
  { value: 'monitor', label: '💻 Tecnología' },
  { value: 'graduationcap', label: '🎓 Educación' },
  { value: 'bike', label: '🚲 Transporte' },
  { value: 'piggybank', label: '🐷 Ahorro' }
]

const goalSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  targetAmount: z.coerce.number().positive('El monto objetivo debe ser mayor a 0'),
  currentAmount: z.coerce.number().min(0, 'El monto actual no puede ser negativo').default(0),
  deadline: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  monthlyTarget: z.coerce.number().min(0).optional(),
  accountId: z.coerce.number().optional(),
  icon: z.string().default('target'),
  color: z.string().default('#10B981')
})

type GoalFormValues = z.infer<typeof goalSchema>

interface GoalFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  goal?: SavingsGoal | null
}

export function GoalFormModal({ open, onClose, onSuccess, goal }: GoalFormModalProps): JSX.Element {
  const isEdit = !!goal
  const [error, setError] = useState<string | null>(null)
  const { accounts } = useAccounts()

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors, isSubmitting } } =
    useForm<GoalFormValues>({
      resolver: zodResolver(goalSchema),
      defaultValues: {
        name: '',
        targetAmount: 0,
        currentAmount: 0,
        priority: 'MEDIUM',
        icon: 'target',
        color: '#10B981'
      }
    })

  useEffect(() => {
    if (open) {
      if (goal) {
        reset({
          name: goal.name,
          targetAmount: goal.targetAmount,
          currentAmount: goal.currentAmount,
          deadline: goal.deadline ? format(new Date(goal.deadline), 'yyyy-MM-dd') : '',
          priority: goal.priority,
          monthlyTarget: goal.monthlyTarget ?? undefined,
          accountId: goal.accountId ?? undefined,
          icon: goal.icon ?? 'target',
          color: goal.color ?? '#10B981'
        })
      } else {
        reset({
          name: '',
          targetAmount: 0,
          currentAmount: 0,
          priority: 'MEDIUM',
          icon: 'target',
          color: '#10B981'
        })
      }
      setError(null)
    }
  }, [open, goal, reset])

  const selectedColor = watch('color')
  const selectedIcon = watch('icon')

  const onSubmit = async (values: GoalFormValues): Promise<void> => {
    setError(null)
    try {
      const dto = {
        name: values.name,
        targetAmount: values.targetAmount,
        currentAmount: values.currentAmount || 0,
        deadline: values.deadline ? new Date(values.deadline) : undefined,
        priority: values.priority,
        monthlyTarget: values.monthlyTarget || undefined,
        accountId: values.accountId || undefined,
        icon: values.icon,
        color: values.color
      }

      const result = isEdit && goal
        ? await window.api.goals.update(goal.id, dto)
        : await window.api.goals.create(dto)

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.error ?? 'Error al guardar la meta')
      }
    } catch {
      setError('Error inesperado al guardar')
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[90vh] bg-[#121418] border border-white/5 rounded-[28px] shadow-2xl overflow-hidden flex flex-col focus:outline-none">
          {/* Header */}
          <div className="flex items-center justify-between p-8 border-b border-white/5 shrink-0">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#10B981] mb-1">
                {isEdit ? 'Editar' : 'Nueva'} Meta
              </p>
              <Dialog.Title className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white">
                {isEdit ? goal?.name : 'Crear meta de ahorro'}
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

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-8 space-y-5 custom-scrollbar">
            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm">
                {error}
              </div>
            )}

            {/* Nombre */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                Nombre de la meta
              </label>
              <Input {...register('name')} placeholder="Ej. Viaje a Europa" />
              {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>}
            </div>

            {/* Monto objetivo / actual */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Monto objetivo
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <Input
                    {...register('targetAmount')}
                    type="number"
                    min={0}
                    placeholder="0"
                    className="pl-8"
                  />
                </div>
                {errors.targetAmount && (
                  <p className="text-xs text-rose-400 mt-1">{errors.targetAmount.message}</p>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Saldo actual
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <Input
                    {...register('currentAmount')}
                    type="number"
                    min={0}
                    placeholder="0"
                    className="pl-8"
                  />
                </div>
              </div>
            </div>

            {/* Fecha límite + prioridad */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Fecha límite (opcional)
                </label>
                <Controller
                  name="deadline"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ? new Date(field.value + 'T00:00:00') : null}
                      onChange={(d) => field.onChange(d ? format(d, 'yyyy-MM-dd') : '')}
                    />
                  )}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Prioridad
                </label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Baja</SelectItem>
                        <SelectItem value="MEDIUM">Media</SelectItem>
                        <SelectItem value="HIGH">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Ahorro mensual + cuenta */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Ahorro mensual (opcional)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <Input
                    {...register('monthlyTarget')}
                    type="number"
                    min={0}
                    placeholder="0"
                    className="pl-8"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Cuenta vinculada (opcional)
                </label>
                <Controller
                  name="accountId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value != null ? String(field.value) : 'NONE'}
                      onValueChange={(v) => field.onChange(v === 'NONE' ? undefined : Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">Sin cuenta</SelectItem>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={String(acc.id)}>
                            {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Icono */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                Icono
              </label>
              <div className="grid grid-cols-4 gap-2">
                {ICON_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setValue('icon', opt.value)}
                    className={cn(
                      'h-12 rounded-2xl text-sm transition-all',
                      selectedIcon === opt.value
                        ? 'bg-[#10B981]/20 border border-[#10B981]/40 text-white'
                        : 'bg-white/5 border border-white/5 text-gray-400 hover:bg-white/10'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setValue('color', c)}
                    className={cn(
                      'w-8 h-8 rounded-xl border-2 transition-all',
                      selectedColor === c ? 'border-white scale-110' : 'border-transparent opacity-70'
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/5 shrink-0 bg-[#0A0B0D] flex justify-end gap-3 rounded-b-[28px]">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit(onSubmit)}
            >
              {isSubmitting ? 'Guardando...' : isEdit ? 'Actualizar meta' : 'Crear meta'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
