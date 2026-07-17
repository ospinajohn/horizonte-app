import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as Dialog from '@radix-ui/react-dialog'
import { Plus, Repeat, X, Edit2, Trash2, AlertTriangle } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import type { Subscription, SubscriptionCategory } from '../../../../shared/types'

// ── Schema ────────────────────────────────────────────────────────────────────
const subscriptionSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  amount: z.coerce.number().positive('Monto requerido'),
  billingDay: z.coerce.number().min(1).max(31),
  category: z.enum(['ENTERTAINMENT', 'PRODUCTIVITY', 'CLOUD', 'OTHER']).default('ENTERTAINMENT'),
  color: z.string().default('#6366f1'),
  icon: z.string().default('repeat'),
  notes: z.string().optional()
})

type SubFormData = z.infer<typeof subscriptionSchema>

// ── Category labels ───────────────────────────────────────────────────────────
const CAT_LABELS: Record<SubscriptionCategory, string> = {
  ENTERTAINMENT: 'Entretenimiento',
  PRODUCTIVITY: 'Productividad',
  CLOUD: 'Nube / Almacenamiento',
  OTHER: 'Otro'
}

const CAT_COLORS: Record<SubscriptionCategory, string> = {
  ENTERTAINMENT: '#A78BFA',
  PRODUCTIVITY: '#60A5FA',
  CLOUD: '#F59E0B',
  OTHER: '#6B7280'
}

// ── Preset subs ───────────────────────────────────────────────────────────────
const PRESETS = [
  { name: 'Netflix', amount: 22900, color: '#E50914', icon: 'play', category: 'ENTERTAINMENT' },
  { name: 'Spotify', amount: 16900, color: '#1DB954', icon: 'music', category: 'ENTERTAINMENT' },
  { name: 'ChatGPT', amount: 83000, color: '#10A37F', icon: 'bot', category: 'PRODUCTIVITY' },
  { name: 'Amazon Prime', amount: 19900, color: '#FF9900', icon: 'package', category: 'ENTERTAINMENT' },
  { name: 'Disney+', amount: 15900, color: '#113CCF', icon: 'tv', category: 'ENTERTAINMENT' },
  { name: 'Microsoft 365', amount: 43900, color: '#0078D4', icon: 'file-text', category: 'PRODUCTIVITY' },
  { name: 'Google One', amount: 3000, color: '#4285F4', icon: 'cloud', category: 'CLOUD' }
]

// ── Form Modal ─────────────────────────────────────────────────────────────────
function SubscriptionFormModal({
  onSuccess,
  editSub
}: {
  onSuccess: () => void
  editSub?: Subscription
}): JSX.Element {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const isEdit = !!editSub

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<SubFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: editSub
      ? {
          name: editSub.name,
          amount: editSub.amount,
          billingDay: editSub.billingDay,
          category: editSub.category,
          color: editSub.color,
          icon: editSub.icon,
          notes: editSub.notes ?? undefined
        }
      : { category: 'ENTERTAINMENT', color: '#6366f1', icon: 'repeat', billingDay: 1 }
  })

  const onSubmit = async (data: SubFormData): Promise<void> => {
    setSaving(true)
    if (isEdit && editSub) {
      await window.api.subscriptions.update(editSub.id, data)
    } else {
      await window.api.subscriptions.create(data)
    }
    setSaving(false)
    reset()
    setOpen(false)
    onSuccess()
  }

  const applyPreset = (preset: typeof PRESETS[0]): void => {
    setValue('name', preset.name)
    setValue('amount', preset.amount)
    setValue('color', preset.color)
    setValue('category', preset.category as SubscriptionCategory)
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
            <Plus size={16} /> Nueva Suscripción
          </button>
        )}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-[#121418] border border-white/5 rounded-[28px] p-8 shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white">
              {isEdit ? 'Editar suscripción' : 'Nueva Suscripción'}
            </Dialog.Title>
            <Dialog.Close className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <X size={14} />
            </Dialog.Close>
          </div>

          {/* Presets */}
          {!isEdit && (
            <div className="mb-5">
              <p className={labelCls}>Acceso rápido</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium border border-white/10 hover:border-white/20 text-gray-300 hover:text-white transition-colors"
                    style={{ borderLeftColor: p.color, borderLeftWidth: 3 }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className={labelCls}>Nombre</label>
              <input {...register('name')} placeholder="Netflix, Spotify..." className={inputCls} />
              {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Monto mensual</label>
                <input {...register('amount')} type="number" placeholder="22900" className={inputCls} />
                {errors.amount && <p className="text-rose-400 text-xs mt-1">{errors.amount.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Día de cobro</label>
                <input {...register('billingDay')} type="number" min="1" max="31" placeholder="15" className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Categoría</label>
              <select {...register('category')} className={inputCls}>
                {(Object.keys(CAT_LABELS) as SubscriptionCategory[]).map((c) => (
                  <option key={c} value={c}>{CAT_LABELS[c]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Color</label>
              <input {...register('color')} type="color" className="w-full h-10 bg-black/30 border border-white/10 rounded-2xl cursor-pointer" />
            </div>

            <div>
              <label className={labelCls}>Notas</label>
              <input {...register('notes')} placeholder="Opcional" className={inputCls} />
            </div>

            <div className="flex gap-3 pt-2">
              <Dialog.Close className="flex-1 h-11 rounded-2xl bg-white/5 border border-white/10 text-gray-400 text-sm font-medium hover:text-white transition-colors">Cancelar</Dialog.Close>
              <button type="submit" disabled={saving} className="flex-1 h-11 rounded-2xl bg-[#10B981] text-black font-bold text-sm hover:bg-[#0ea371] transition-colors disabled:opacity-50">
                {saving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ── Subscription Card ──────────────────────────────────────────────────────────
function SubCard({ sub, onRefresh }: { sub: Subscription; onRefresh: () => void }): JSX.Element {
  const hasPriceChange = sub.lastBilledAmount !== null && sub.lastBilledAmount !== sub.amount
  const catColor = CAT_COLORS[sub.category] ?? '#6B7280'

  return (
    <div
      className="bg-[#121418] border border-white/5 rounded-[28px] p-6 hover:border-white/10 transition-all duration-200 group relative overflow-hidden"
      style={{ borderLeftColor: sub.color, borderLeftWidth: 4 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${sub.color}20` }}>
            <Repeat size={18} style={{ color: sub.color }} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{sub.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xl border"
                style={{ color: catColor, borderColor: `${catColor}30`, backgroundColor: `${catColor}10` }}
              >
                {CAT_LABELS[sub.category]}
              </span>
              {hasPriceChange && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-xl">
                  <AlertTriangle size={10} /> Precio cambió
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Hover actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <SubscriptionFormModal onSuccess={onRefresh} editSub={sub} />
          <button
            onClick={async () => { await window.api.subscriptions.delete(sub.id); onRefresh() }}
            className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-rose-400 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white">
            {formatCurrency(sub.amount)}
            <span className="text-sm font-normal text-gray-500">/mes</span>
          </p>
          {hasPriceChange && (
            <p className="text-xs text-amber-400 mt-0.5">
              Antes: {formatCurrency(sub.lastBilledAmount!)}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Cobro</p>
          <p className="text-sm font-medium text-gray-300">Día {sub.billingDay}</p>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export function SubscriptionsPage(): JSX.Element {
  const [subs, setSubs] = useState<Subscription[]>([])
  const [totals, setTotals] = useState({ monthly: 0, annual: 0 })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (): Promise<void> => {
    setLoading(true)
    const [subsResult, totalsResult] = await Promise.all([
      window.api.subscriptions.getAll(),
      window.api.subscriptions.getTotals()
    ])
    if (subsResult.success && subsResult.data) setSubs(subsResult.data)
    if (totalsResult.success && totalsResult.data) setTotals(totalsResult.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

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
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#10B981] mb-2">// Módulo</p>
          <h1 className="text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-white tracking-tight">
            Suscripciones
          </h1>
        </div>
        <SubscriptionFormModal onSuccess={load} />
      </div>

      <div className="flex-1 overflow-y-auto px-12 py-8 custom-scrollbar">
        {/* Summary card */}
        <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8 mb-8 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#10B981]/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative flex gap-16 items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Total mensual</p>
              <p className="text-5xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-[#10B981]">
                {formatCurrency(totals.monthly)}
              </p>
            </div>
            <div className="w-px h-16 bg-white/5" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Total anual</p>
              <p className="text-3xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-amber-400">
                {formatCurrency(totals.annual)}
              </p>
            </div>
            <div className="w-px h-16 bg-white/5" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Suscripciones activas</p>
              <p className="text-3xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white">
                {subs.length}
              </p>
            </div>
          </div>
        </div>

        {/* Subs grid */}
        {subs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-[#10B981]/10 rounded-full flex items-center justify-center mb-4 border border-[#10B981]/20">
              <Repeat size={28} className="text-[#10B981]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sin suscripciones</h3>
            <p className="text-sm text-gray-500 max-w-xs">
              Registra tus servicios de suscripción para controlar el costo mensual y anual.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {subs.map((sub) => (
              <SubCard key={sub.id} sub={sub} onRefresh={load} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
