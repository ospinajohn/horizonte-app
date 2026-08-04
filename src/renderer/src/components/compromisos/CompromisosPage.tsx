import { useState, useEffect, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as Dialog from '@radix-ui/react-dialog'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, CalendarCheck, X, Edit2, Trash2, CheckCircle2, Clock } from 'lucide-react'
import { formatCurrency, cn, parseLocalDate } from '@/lib/utils'
import { DatePicker } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useAccounts } from '@/hooks/useAccounts'
import { useCategories } from '@/hooks/useCategories'
import type { RecurringItem, RecurrenceType, CreateRecurringItemDto } from '../../../../shared/types'

// ── Schema ────────────────────────────────────────────────────────────────────
const compromisoSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  type: z.enum(['EXPENSE', 'PAYMENT']).default('EXPENSE'),
  amount: z.coerce.number().positive('Monto requerido'),
  recurrence: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ANNUAL']),
  nextDate: z.string().min(1, 'Fecha requerida'),
  endDate: z.string().optional(),
  categoryId: z.coerce.number().optional(),
  accountId: z.coerce.number().min(1, 'Selecciona una cuenta')
})

type CompFormData = z.infer<typeof compromisoSchema>

// ── Labels ────────────────────────────────────────────────────────────────────
const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  NONE: 'Única vez',
  DAILY: 'Diaria',
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quincenal',
  MONTHLY: 'Mensual',
  ANNUAL: 'Anual'
}

const TYPE_LABELS: Record<string, string> = {
  EXPENSE: 'Gasto',
  PAYMENT: 'Pago',
  INCOME: 'Ingreso'
}

const TYPE_COLORS: Record<string, string> = {
  EXPENSE: 'rose',
  PAYMENT: 'amber',
  INCOME: 'emerald'
}

// ── Form Modal ────────────────────────────────────────────────────────────────
function CompromisoFormModal({
  onSuccess,
  editItem
}: {
  onSuccess: () => void
  editItem?: RecurringItem
}): JSX.Element {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const isEdit = !!editItem
  const { accounts } = useAccounts()
  const { categories } = useCategories('EXPENSE')

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<CompFormData>({
    resolver: zodResolver(compromisoSchema),
    defaultValues: editItem
      ? {
          name: editItem.name,
          type: editItem.type as 'EXPENSE' | 'PAYMENT',
          amount: editItem.amount,
          recurrence: editItem.recurrence as any,
          nextDate: format(new Date(editItem.nextDate), 'yyyy-MM-dd'),
          endDate: editItem.endDate ? format(new Date(editItem.endDate), 'yyyy-MM-dd') : undefined,
          categoryId: editItem.categoryId ?? undefined,
          accountId: editItem.accountId ?? (accounts[0]?.id ?? 0)
        }
      : { type: 'EXPENSE', recurrence: 'MONTHLY', accountId: accounts[0]?.id ?? 0 }
  })

  const onSubmit = async (data: CompFormData): Promise<void> => {
    setSaving(true)
    const dto: CreateRecurringItemDto = {
      name: data.name,
      type: data.type,
      amount: data.amount,
      recurrence: data.recurrence,
      nextDate: parseLocalDate(data.nextDate),
      endDate: data.endDate ? parseLocalDate(data.endDate) : undefined,
      categoryId: data.categoryId || undefined,
      accountId: data.accountId
    }

    if (isEdit && editItem) {
      await window.api.recurring.update(editItem.id, dto)
    } else {
      await window.api.recurring.create(dto)
    }
    setSaving(false)
    reset()
    setOpen(false)
    onSuccess()
  }

  const inputCls = 'w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#10B981]/50'
  const labelCls = 'text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 block'

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        {isEdit ? (
          <button className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-colors">
            <Edit2 size={13} />
          </button>
        ) : (
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#10B981] text-black font-bold text-sm rounded-2xl hover:bg-[#0ea371] transition-colors shadow-lg shadow-[#10B981]/20">
            <Plus size={16} /> Nuevo Compromiso
          </button>
        )}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[85vh] bg-[#121418] border border-white/5 rounded-[28px] shadow-2xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-8 pb-0 shrink-0">
            <Dialog.Title className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white">
              {isEdit ? 'Editar compromiso' : 'Nuevo Compromiso'}
            </Dialog.Title>
            <Dialog.Close className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <X size={14} />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className={labelCls}>Nombre</label>
                <input {...register('name')} placeholder="Arriendo, Luz, Agua..." className={inputCls} />
                {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Tipo</label>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EXPENSE">Gasto</SelectItem>
                          <SelectItem value="PAYMENT">Pago</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div>
                  <label className={labelCls}>Frecuencia</label>
                  <Controller
                    name="recurrence"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ANNUAL'] as RecurrenceType[]).map(r => (
                            <SelectItem key={r} value={r}>{RECURRENCE_LABELS[r]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Monto</label>
                  <input {...register('amount')} type="number" placeholder="0" className={inputCls} />
                  {errors.amount && <p className="text-rose-400 text-xs mt-1">{errors.amount.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Cuenta</label>
                  <Controller
                    name="accountId"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value != null ? String(field.value) : ''} onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Cuenta" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map(a => (
                            <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Categoría</label>
                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value != null ? String(field.value) : ''} onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sin categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(c => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Próxima fecha</label>
                  <Controller
                    name="nextDate"
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
                  <label className={labelCls}>Fecha fin <span className="text-gray-700 normal-case tracking-normal">(opcional)</span></label>
                  <Controller
                    name="endDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        value={field.value ? new Date(field.value + 'T00:00:00') : null}
                        onChange={(d) => field.onChange(d ? format(d, 'yyyy-MM-dd') : '')}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Dialog.Close className="flex-1 h-11 rounded-2xl bg-white/5 border border-white/10 text-gray-400 text-sm font-medium hover:text-white transition-colors">Cancelar</Dialog.Close>
                <button type="submit" disabled={saving} className="flex-1 h-11 rounded-2xl bg-[#10B981] text-black font-bold text-sm hover:bg-[#0ea371] transition-colors disabled:opacity-50">
                  {saving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ── Compromiso Card ───────────────────────────────────────────────────────────
function CompromisoCard({ item, onRefresh }: { item: RecurringItem; onRefresh: () => void }): JSX.Element {
  const [paying, setPaying] = useState(false)
  const colorKey = TYPE_COLORS[item.type] ?? 'rose'
  const nextDate = new Date(item.nextDate)
  const isDueSoon = (nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24) <= 3

  const handleMarkPaid = async (): Promise<void> => {
    setPaying(true)
    await window.api.recurring.markAsPaid(item.id)
    setPaying(false)
    onRefresh()
  }

  return (
    <div className={cn(
      'bg-[#121418] border rounded-[28px] p-6 transition-all duration-200 group relative overflow-hidden',
      isDueSoon ? 'border-amber-500/30' : 'border-white/5 hover:border-white/10'
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-2xl flex items-center justify-center',
            colorKey === 'rose' && 'bg-rose-500/10',
            colorKey === 'amber' && 'bg-amber-500/10',
            colorKey === 'emerald' && 'bg-emerald-500/10'
          )}>
            <CalendarCheck size={18} className={cn(
              colorKey === 'rose' && 'text-rose-400',
              colorKey === 'amber' && 'text-amber-400',
              colorKey === 'emerald' && 'text-emerald-400'
            )} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{item.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn(
                'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xl border',
                colorKey === 'rose' && 'text-rose-400 border-rose-500/20 bg-rose-500/10',
                colorKey === 'amber' && 'text-amber-400 border-amber-500/20 bg-amber-500/10',
                colorKey === 'emerald' && 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
              )}>
                {TYPE_LABELS[item.type] ?? item.type}
              </span>
              <span className="text-[10px] text-gray-600">{RECURRENCE_LABELS[item.recurrence as RecurrenceType] ?? item.recurrence}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <CompromisoFormModal onSuccess={onRefresh} editItem={item} />
          <button
            onClick={async () => { await window.api.recurring.delete(item.id); onRefresh() }}
            className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-rose-400 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white">
            {formatCurrency(item.amount)}
          </p>
          {item.category && (
            <p className="text-[11px] text-gray-600 mt-0.5">{item.category.name}</p>
          )}
        </div>
        <div className="text-right flex flex-col items-end gap-2">
          <div className="flex items-center gap-1.5">
            <Clock size={12} className={isDueSoon ? 'text-amber-400' : 'text-gray-600'} />
            <p className={cn('text-xs font-medium', isDueSoon ? 'text-amber-400' : 'text-gray-400')}>
              {format(nextDate, "d 'de' MMM", { locale: es })}
            </p>
          </div>
          <button
            onClick={handleMarkPaid}
            disabled={paying}
            title="Registra el pago como una transacción real, descuenta el monto de la cuenta asociada y avanza la fecha al siguiente ciclo. Si no lo marcas, seguirá apareciendo como pendiente pero no afectará tu saldo."
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] text-xs font-bold hover:bg-[#10B981]/20 transition-colors disabled:opacity-50"
          >
            <CheckCircle2 size={12} />
            {paying ? '...' : 'Marcar pagado'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export function CompromisosPage(): JSX.Element {
  const [items, setItems] = useState<RecurringItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (): Promise<void> => {
    setLoading(true)
    const result = await window.api.recurring.getAll(true)
    if (result.success && result.data) {
      setItems(result.data.filter(i => i.type !== 'INCOME'))
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const totalMonthly = items.reduce((acc, item) => {
    if (item.recurrence === 'MONTHLY') return acc + item.amount
    if (item.recurrence === 'WEEKLY') return acc + item.amount * 4.33
    if (item.recurrence === 'BIWEEKLY') return acc + item.amount * 2.17
    if (item.recurrence === 'ANNUAL') return acc + item.amount / 12
    if (item.recurrence === 'DAILY') return acc + item.amount * 30
    return acc + item.amount
  }, 0)

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-12 py-8 shrink-0 flex items-end justify-between border-b border-white/5 bg-[#08090B]/80 backdrop-blur-md sticky top-0 z-10">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#10B981] mb-2">// Finanzas</p>
          <h1 className="text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-white tracking-tight">
            Compromisos Fijos
          </h1>
          <p className="text-sm text-gray-500 mt-2 max-w-xl">
            Pagos fijos (arriendo, servicios, cuotas) que afectan tu balance real: al marcar uno como pagado se registra la transacción y se descuenta de tu cuenta. Si buscas un gasto recurrente que solo quieres monitorear sin que mueva tu saldo (ej. una suscripción), usa el módulo de Suscripciones.
          </p>
        </div>
        <CompromisoFormModal onSuccess={load} />
      </div>

      <div className="flex-1 overflow-y-auto px-12 py-8 custom-scrollbar">
        {/* Summary */}
        <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8 mb-8 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-rose-500/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative flex gap-16 items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Total mensual estimado</p>
              <p className="text-5xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-rose-400">
                {formatCurrency(totalMonthly)}
              </p>
            </div>
            <div className="w-px h-16 bg-white/5" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Compromisos activos</p>
              <p className="text-3xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white">
                {items.length}
              </p>
            </div>
          </div>
        </div>

        {/* Items grid */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-4 border border-rose-500/20">
              <CalendarCheck size={28} className="text-rose-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sin compromisos fijos</h3>
            <p className="text-sm text-gray-500 max-w-xs">
              Registra tus gastos obligatorios como arriendo, servicios públicos y demás para controlar tus gastos fijos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <CompromisoCard key={item.id} item={item} onRefresh={load} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
