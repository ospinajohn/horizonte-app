import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as Dialog from '@radix-ui/react-dialog'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, CreditCard as CreditCardIcon, X, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import type { CreditCard, CreditCardPurchase } from '../../../../shared/types'

// ── Schemas ───────────────────────────────────────────────────────────────────
const cardSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  bank: z.string().min(1, 'Banco requerido'),
  totalLimit: z.coerce.number().positive('Debe ser positivo'),
  cutDay: z.coerce.number().min(1).max(31),
  paymentDay: z.coerce.number().min(1).max(31),
  annualRate: z.coerce.number().min(0).max(200).default(0),
  color: z.string().default('#6366f1')
})

const purchaseSchema = z.object({
  description: z.string().min(1, 'Descripción requerida'),
  amount: z.coerce.number().positive('Monto requerido'),
  date: z.string().min(1, 'Fecha requerida'),
  installments: z.coerce.number().int().min(1).max(36).default(1),
  isAdvance: z.boolean().default(false)
})

type CardFormData = z.infer<typeof cardSchema>
type PurchaseFormData = z.infer<typeof purchaseSchema>

// ── Card Form Modal ────────────────────────────────────────────────────────────
function CardFormModal({ onSuccess }: { onSuccess: () => void }): JSX.Element {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
    defaultValues: { annualRate: 0, color: '#6366f1' }
  })

  const onSubmit = async (data: CardFormData): Promise<void> => {
    setSaving(true)
    const result = await window.api.creditCards.create(data)
    setSaving(false)
    if (result.success) { reset(); setOpen(false); onSuccess() }
  }

  const inputCls = 'w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#10B981]/50'
  const labelCls = 'text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 block'

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-[#10B981] text-black font-bold text-sm rounded-2xl hover:bg-[#0ea371] transition-colors shadow-lg shadow-[#10B981]/20">
          <Plus size={16} /> Nueva Tarjeta
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-[#121418] border border-white/5 rounded-[28px] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white">Nueva Tarjeta</Dialog.Title>
            <Dialog.Close className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <X size={14} />
            </Dialog.Close>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Nombre tarjeta</label>
                <input {...register('name')} placeholder="Visa Infinite" className={inputCls} />
                {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Banco</label>
                <input {...register('bank')} placeholder="Bancolombia" className={inputCls} />
                {errors.bank && <p className="text-rose-400 text-xs mt-1">{errors.bank.message}</p>}
              </div>
            </div>
            <div>
              <label className={labelCls}>Cupo total</label>
              <input {...register('totalLimit')} type="number" placeholder="5000000" className={inputCls} />
              {errors.totalLimit && <p className="text-rose-400 text-xs mt-1">{errors.totalLimit.message}</p>}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Día corte</label>
                <input {...register('cutDay')} type="number" min="1" max="31" placeholder="25" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Día pago</label>
                <input {...register('paymentDay')} type="number" min="1" max="31" placeholder="10" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Tasa EA %</label>
                <input {...register('annualRate')} type="number" step="0.1" placeholder="28" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Color</label>
              <input {...register('color')} type="color" className="w-full h-10 bg-black/30 border border-white/10 rounded-2xl cursor-pointer" />
            </div>
            <div className="flex gap-3 pt-2">
              <Dialog.Close className="flex-1 h-11 rounded-2xl bg-white/5 border border-white/10 text-gray-400 text-sm font-medium hover:text-white transition-colors">Cancelar</Dialog.Close>
              <button type="submit" disabled={saving} className="flex-1 h-11 rounded-2xl bg-[#10B981] text-black font-bold text-sm hover:bg-[#0ea371] transition-colors disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ── Purchase Form Modal ────────────────────────────────────────────────────────
function PurchaseFormModal({ cardId, onSuccess }: { cardId: number; onSuccess: () => void }): JSX.Element {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: { installments: 1, isAdvance: false }
  })

  const onSubmit = async (data: PurchaseFormData): Promise<void> => {
    setSaving(true)
    const result = await window.api.creditCards.addPurchase({
      cardId,
      description: data.description,
      amount: data.amount,
      date: new Date(data.date),
      installments: data.installments,
      isAdvance: data.isAdvance
    })
    setSaving(false)
    if (result.success) { reset(); setOpen(false); onSuccess() }
  }

  const inputCls = 'w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#10B981]/50'
  const labelCls = 'text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 block'

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-gray-300 text-xs rounded-2xl hover:bg-white/10 transition-colors border border-white/10">
          <ShoppingBag size={12} /> Registrar compra
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-[#121418] border border-white/5 rounded-[28px] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white">Registrar Compra</Dialog.Title>
            <Dialog.Close className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <X size={14} />
            </Dialog.Close>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className={labelCls}>Descripción</label>
              <input {...register('description')} placeholder="Supermercado, ropa..." className={inputCls} />
              {errors.description && <p className="text-rose-400 text-xs mt-1">{errors.description.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Monto</label>
                <input {...register('amount')} type="number" placeholder="150000" className={inputCls} />
                {errors.amount && <p className="text-rose-400 text-xs mt-1">{errors.amount.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Cuotas</label>
                <input {...register('installments')} type="number" min="1" max="36" placeholder="1" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Fecha</label>
              <input {...register('date')} type="date" className={inputCls} />
              {errors.date && <p className="text-rose-400 text-xs mt-1">{errors.date.message}</p>}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input {...register('isAdvance')} type="checkbox" className="accent-[#10B981]" />
              <span className="text-sm text-gray-300">Es avance en efectivo</span>
            </label>
            <div className="flex gap-3 pt-2">
              <Dialog.Close className="flex-1 h-11 rounded-2xl bg-white/5 border border-white/10 text-gray-400 text-sm font-medium hover:text-white transition-colors">Cancelar</Dialog.Close>
              <button type="submit" disabled={saving} className="flex-1 h-11 rounded-2xl bg-[#10B981] text-black font-bold text-sm hover:bg-[#0ea371] transition-colors disabled:opacity-50">
                {saving ? 'Guardando...' : 'Registrar'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ── Card Visual ────────────────────────────────────────────────────────────────
function CardVisual({ card, onDelete, onRefresh }: {
  card: CreditCard
  onDelete: () => void
  onRefresh: () => void
}): JSX.Element {
  const [showPurchases, setShowPurchases] = useState(false)

  const usedAmount = card.usedAmount ?? 0
  const availableLimit = card.availableLimit ?? card.totalLimit
  const usagePercent = card.totalLimit > 0 ? (usedAmount / card.totalLimit) * 100 : 0

  let usageColor = 'text-[#10B981]'
  let barColor = 'bg-[#10B981]'
  if (usagePercent >= 80) { usageColor = 'text-rose-400'; barColor = 'bg-rose-500' }
  else if (usagePercent >= 50) { usageColor = 'text-amber-400'; barColor = 'bg-amber-500' }

  const currentPeriodPurchases = (card.purchases ?? []).filter((p) => {
    const now = new Date()
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return p.billingPeriod === period
  })

  return (
    <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8 hover:border-white/10 transition-all duration-200">
      {/* Card header visual */}
      <div
        className="rounded-[20px] p-6 mb-6 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${card.color}30 0%, ${card.color}10 100%)`, borderColor: `${card.color}30`, border: `1px solid ${card.color}30` }}
      >
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{card.bank}</p>
            <p className="text-lg font-bold text-white">{card.name}</p>
          </div>
          <CreditCardIcon size={24} style={{ color: card.color }} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Disponible</p>
          <p className={cn('text-3xl font-["Plus_Jakarta_Sans",sans-serif] font-extrabold', usageColor)}>
            {formatCurrency(availableLimit)}
          </p>
        </div>
      </div>

      {/* Usage bar */}
      <div className="mb-5">
        <div className="flex justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Uso del cupo</span>
          <span className={cn('text-xs font-bold', usageColor)}>{usagePercent.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full transition-all duration-1000', barColor)} style={{ width: `${Math.min(usagePercent, 100)}%` }} />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-gray-600">
          <span>Usado: {formatCurrency(usedAmount)}</span>
          <span>Total: {formatCurrency(card.totalLimit)}</span>
        </div>
      </div>

      {/* Cut & payment days */}
      <div className="flex gap-4 mb-5">
        <div className="flex-1 bg-black/20 rounded-2xl p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Día corte</p>
          <p className="text-sm font-bold text-white">Día {card.cutDay}</p>
        </div>
        <div className="flex-1 bg-black/20 rounded-2xl p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Día pago</p>
          <p className="text-sm font-bold text-white">Día {card.paymentDay}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <PurchaseFormModal cardId={card.id} onSuccess={onRefresh} />
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPurchases((v) => !v)}
            className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1"
          >
            {currentPeriodPurchases.length} compras {showPurchases ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <button onClick={async () => { await window.api.creditCards.delete(card.id); onDelete() }} className="text-xs text-gray-600 hover:text-rose-400 transition-colors">
            Eliminar
          </button>
        </div>
      </div>

      {/* Purchases list */}
      {showPurchases && currentPeriodPurchases.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
          {currentPeriodPurchases.map((p: CreditCardPurchase) => (
            <div key={p.id} className="flex justify-between items-center text-xs py-1.5 border-b border-white/3">
              <div>
                <span className="text-gray-300">{p.description}</span>
                {p.installments > 1 && <span className="ml-2 text-gray-600">({p.installments}x)</span>}
                {p.isAdvance && <span className="ml-2 text-amber-500 text-[10px] font-bold">AVANCE</span>}
              </div>
              <span className="text-rose-400 font-medium">{formatCurrency(p.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export function CreditCardsPage(): JSX.Element {
  const [cards, setCards] = useState<CreditCard[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (): Promise<void> => {
    setLoading(true)
    const result = await window.api.creditCards.getAll()
    if (result.success && result.data) {
      // Enriquecer con balance calculado
      const now = new Date()
      const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const enriched = (result.data as CreditCard[]).map((card) => {
        const periodPurchases = (card.purchases ?? []).filter((p) => p.billingPeriod === period)
        const usedAmount = periodPurchases.reduce((s, p) => s + p.amount, 0)
        return { ...card, usedAmount, availableLimit: Math.max(card.totalLimit - usedAmount, 0) }
      })
      setCards(enriched)
    }
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
            Tarjetas de Crédito
          </h1>
        </div>
        <CardFormModal onSuccess={load} />
      </div>

      <div className="flex-1 overflow-y-auto px-12 py-8 custom-scrollbar">
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-[#10B981]/10 rounded-full flex items-center justify-center mb-4 border border-[#10B981]/20">
              <CreditCardIcon size={28} className="text-[#10B981]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sin tarjetas registradas</h3>
            <p className="text-sm text-gray-500 max-w-xs">
              Registra tus tarjetas de crédito para controlar el cupo disponible y las compras del período.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {cards.map((card) => (
              <CardVisual key={card.id} card={card} onDelete={load} onRefresh={load} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
