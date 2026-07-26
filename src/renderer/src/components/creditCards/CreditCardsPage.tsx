import { useState, useEffect, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as Dialog from '@radix-ui/react-dialog'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, CreditCard as CreditCardIcon, X, ShoppingBag, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { DatePicker } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { CreditCard, CreditCardPurchase, CardIntelligence, CardRecommendation, CardPurchaseAnalytics } from '../../../../shared/types'

// ── Schemas ───────────────────────────────────────────────────────────────────
const BENEFIT_TYPE_OPTIONS = [
  { value: 'CASHBACK', label: 'Cashback' },
  { value: 'MILES', label: 'Millas' },
  { value: 'POINTS', label: 'Puntos' },
  { value: 'DISCOUNTS', label: 'Descuentos' }
] as const

const STATUS_LABEL: Record<CardIntelligence['status'], string> = {
  EXCELLENT: 'Excelente momento',
  GOOD: 'Buen momento',
  NORMAL: 'Momento normal',
  AVOID: 'Evita comprar'
}

const STATUS_BADGE_CLASS: Record<CardIntelligence['status'], string> = {
  EXCELLENT: 'bg-[#10B981]/20 text-[#10B981] border-transparent',
  GOOD: 'bg-blue-500/20 text-blue-400 border-transparent',
  NORMAL: 'bg-amber-500/20 text-amber-400 border-transparent',
  AVOID: 'bg-rose-500/20 text-rose-400 border-transparent'
}

const cardSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  bank: z.string().min(1, 'Banco requerido'),
  totalLimit: z.coerce.number().positive('Debe ser positivo'),
  cutDay: z.coerce.number().min(1).max(31),
  paymentDay: z.coerce.number().min(1).max(31),
  annualRate: z.coerce.number().min(0).max(200).default(0),
  color: z.string().default('#6366f1'),
  franchise: z.string().optional(),
  cashbackPercent: z.coerce.number().min(0).max(100).optional(),
  benefitTypes: z.array(z.enum(['CASHBACK', 'MILES', 'POINTS', 'DISCOUNTS'])).optional(),
  benefitCategories: z.string().optional()
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
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
    defaultValues: { annualRate: 0, color: '#6366f1', benefitTypes: [] }
  })

  const onSubmit = async (data: CardFormData): Promise<void> => {
    setSaving(true)
    const result = await window.api.creditCards.create({
      ...data,
      benefitCategories: data.benefitCategories
        ? data.benefitCategories.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined
    })
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Color</label>
                <input {...register('color')} type="color" className="w-full h-10 bg-black/30 border border-white/10 rounded-2xl cursor-pointer" />
              </div>
              <div>
                <label className={labelCls}>Franquicia</label>
                <input {...register('franchise')} placeholder="Visa, Mastercard..." className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Cashback %</label>
              <input {...register('cashbackPercent')} type="number" step="0.1" placeholder="1.5" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Tipo de beneficios</label>
              <Controller
                name="benefitTypes"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-wrap gap-3">
                    {BENEFIT_TYPE_OPTIONS.map((opt) => {
                      const checked = (field.value ?? []).includes(opt.value)
                      return (
                        <label key={opt.value} className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                          <input
                            type="checkbox"
                            className="accent-[#10B981]"
                            checked={checked}
                            onChange={(e) => {
                              const current = field.value ?? []
                              field.onChange(
                                e.target.checked
                                  ? [...current, opt.value]
                                  : current.filter((v) => v !== opt.value)
                              )
                            }}
                          />
                          {opt.label}
                        </label>
                      )
                    })}
                  </div>
                )}
              />
            </div>
            <div>
              <label className={labelCls}>Categorías con beneficio (separadas por coma)</label>
              <input {...register('benefitCategories')} placeholder="supermercados, restaurantes" className={inputCls} />
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
function PurchaseFormModal({ cardId, cardName, onSuccess }: {
  cardId: number
  cardName: string
  onSuccess: () => void
}): JSX.Element {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [betterCard, setBetterCard] = useState<CardRecommendation | null>(null)
  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: { installments: 1, isAdvance: false }
  })

  const amount = watch('amount')

  useEffect(() => {
    if (!open || !amount || amount <= 0) { setBetterCard(null); return }

    const timeout = setTimeout(async () => {
      const result = await window.api.creditCards.recommendForPurchase(amount)
      if (result.success && result.data) {
        const top = result.data.find((r: CardRecommendation) => r.eligible)
        setBetterCard(top && top.cardId !== cardId ? top : null)
      }
    }, 400)

    return () => clearTimeout(timeout)
  }, [amount, open, cardId])

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
    if (result.success) { reset(); setBetterCard(null); setOpen(false); onSuccess() }
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
            {betterCard && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3">
                <p className="text-xs text-blue-300">
                  💡 ¿Sabías que <span className="font-bold">{betterCard.name}</span> podría convenirte más para esta compra que {cardName}?
                </p>
                {betterCard.reasons[0] && <p className="text-[11px] text-blue-400/80 mt-1">{betterCard.reasons[0]}</p>}
              </div>
            )}
            <div>
              <label className={labelCls}>Fecha</label>
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
function CardVisual({ card, intelligence, onDelete, onRefresh }: {
  card: CreditCard
  intelligence?: CardIntelligence
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
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {card.bank}{card.franchise ? ` · ${card.franchise}` : ''}
            </p>
            <p className="text-lg font-bold text-white">{card.name}</p>
          </div>
          <CreditCardIcon size={24} style={{ color: card.color }} />
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Disponible</p>
            <p className={cn('text-3xl font-["Plus_Jakarta_Sans",sans-serif] font-extrabold', usageColor)}>
              {formatCurrency(availableLimit)}
            </p>
          </div>
          {intelligence && (
            <Badge className={STATUS_BADGE_CLASS[intelligence.status]}>
              {STATUS_LABEL[intelligence.status]}
            </Badge>
          )}
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
        {intelligence && (
          <div className="flex-1 bg-black/20 rounded-2xl p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Si compras hoy</p>
            <p className="text-sm font-bold text-white">{intelligence.financingDaysIfPurchaseToday} días</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <PurchaseFormModal cardId={card.id} cardName={card.name} onSuccess={onRefresh} />
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

// ── Centro de oportunidades ──────────────────────────────────────────────────────
function OpportunityCenter({ intelligence }: { intelligence: CardIntelligence[] }): JSX.Element | null {
  const goodMoment = intelligence.filter((c) => c.status === 'EXCELLENT' || c.status === 'GOOD')
  const nextCut = [...intelligence].sort((a, b) => a.daysUntilCut - b.daysUntilCut)[0]
  const nextPayment = [...intelligence].sort((a, b) => a.daysUntilPayment - b.daysUntilPayment)[0]

  if (intelligence.length === 0) return null

  return (
    <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8 mb-6">
      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Centro de oportunidades</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-black/20 rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Hoy puedes aprovechar</p>
          {goodMoment.length === 0 ? (
            <p className="text-xs text-gray-600">Ninguna tarjeta está en buen momento hoy</p>
          ) : (
            <div className="space-y-2">
              {goodMoment.map((c) => (
                <div key={c.cardId} className="flex items-center justify-between">
                  <span className="text-sm text-white font-medium">✅ {c.name}</span>
                  <span className="text-xs text-gray-400">{c.financingDaysIfPurchaseToday} días</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-black/20 rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Próximo corte</p>
          {nextCut && (
            <div>
              <p className="text-sm text-white font-medium">{nextCut.name}</p>
              <p className="text-xs text-gray-400">
                {nextCut.daysUntilCut === 0 ? 'Hoy' : `En ${nextCut.daysUntilCut} día${nextCut.daysUntilCut === 1 ? '' : 's'}`}
              </p>
            </div>
          )}
        </div>
        <div className="bg-black/20 rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Próximo pago</p>
          {nextPayment && (
            <div>
              <p className="text-sm text-white font-medium">{nextPayment.name}</p>
              <p className="text-xs text-gray-400">
                {nextPayment.daysUntilPayment === 0 ? 'Hoy' : `En ${nextPayment.daysUntilPayment} día${nextPayment.daysUntilPayment === 1 ? '' : 's'}`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Análisis histórico ────────────────────────────────────────────────────────────
function AnalyticsSummary({ analytics }: { analytics: CardPurchaseAnalytics }): JSX.Element | null {
  if (analytics.totalPurchases === 0) return null

  return (
    <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8 mb-6">
      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-1">
        Análisis histórico
      </h3>
      <p className="text-[11px] text-gray-600 mb-4">Compras de los últimos {analytics.periodMonths} meses</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-black/20 rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Financiación promedio</p>
          <p className="text-2xl font-bold text-white">{analytics.avgFinancingDays} días</p>
        </div>
        <div className="bg-black/20 rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Compras en buen momento</p>
          <p className="text-2xl font-bold text-[#10B981]">{analytics.goodMomentPercent}%</p>
          <p className="text-[11px] text-gray-600">{analytics.goodMomentPurchases} de {analytics.totalPurchases} compras</p>
        </div>
        <div className="bg-black/20 rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Compras cerca del corte</p>
          <p className="text-2xl font-bold text-rose-400">{analytics.avoidMomentPurchases}</p>
          <p className="text-[11px] text-gray-600">perdieron días de financiación</p>
        </div>
      </div>
    </div>
  )
}

// ── Comparador de tarjetas ──────────────────────────────────────────────────────
function CardComparator({ intelligence }: { intelligence: CardIntelligence[] }): JSX.Element {
  const sorted = [...intelligence].sort(
    (a, b) => b.financingDaysIfPurchaseToday - a.financingDaysIfPurchaseToday
  )
  const bestId = sorted[0]?.cardId

  return (
    <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8 mb-6">
      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Comparador de tarjetas</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b border-white/5">
              <th className="pb-3 pr-4">Tarjeta</th>
              <th className="pb-3 pr-4">Días para pagar</th>
              <th className="pb-3 pr-4">Cashback</th>
              <th className="pb-3">Recomendación</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((card) => (
              <tr key={card.cardId} className="border-b border-white/3">
                <td className="py-2.5 pr-4 text-white font-medium">{card.name}</td>
                <td className="py-2.5 pr-4 text-gray-300">{card.financingDaysIfPurchaseToday}</td>
                <td className="py-2.5 pr-4 text-gray-300">{card.cashbackPercent > 0 ? `${card.cashbackPercent}%` : '—'}</td>
                <td className="py-2.5">
                  {card.cardId === bestId ? (
                    <span className="text-[#10B981] font-bold">⭐ Mejor opción</span>
                  ) : (
                    <Badge className={STATUS_BADGE_CLASS[card.status]}>{STATUS_LABEL[card.status]}</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Asistente de compras ─────────────────────────────────────────────────────────
function PurchaseAssistantModal(): JSX.Element {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<CardRecommendation[] | null>(null)

  const onSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    const value = Number(amount)
    if (!(value > 0)) return
    setLoading(true)
    const result = await window.api.creditCards.recommendForPurchase(value)
    setLoading(false)
    if (result.success && result.data) setRecommendations(result.data)
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setRecommendations(null); setAmount('') } }}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-white/5 text-gray-200 font-bold text-sm rounded-2xl hover:bg-white/10 transition-colors border border-white/10">
          <Sparkles size={16} /> Asistente de compras
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-[#121418] border border-white/5 rounded-[28px] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white">Asistente de compras</Dialog.Title>
            <Dialog.Close className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <X size={14} />
            </Dialog.Close>
          </div>
          <form onSubmit={onSubmit} className="flex gap-3 mb-6">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Monto de la compra"
              className="flex-1 bg-black/30 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#10B981]/50"
            />
            <button type="submit" disabled={loading} className="px-5 rounded-2xl bg-[#10B981] text-black font-bold text-sm hover:bg-[#0ea371] transition-colors disabled:opacity-50">
              {loading ? '...' : 'Analizar'}
            </button>
          </form>

          {recommendations && (
            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
              {recommendations.map((rec, idx) => (
                <div
                  key={rec.cardId}
                  className={cn(
                    'bg-black/20 rounded-2xl p-4 border',
                    idx === 0 && rec.eligible ? 'border-[#10B981]/40' : 'border-white/5'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-white">
                      {idx === 0 && rec.eligible && '⭐ '}{rec.name} <span className="text-gray-500 font-normal">({rec.bank})</span>
                    </p>
                    {!rec.eligible && <span className="text-[10px] font-bold text-rose-400">SIN CUPO</span>}
                  </div>
                  <ul className="space-y-1">
                    {rec.reasons.map((reason, i) => (
                      <li key={i} className="text-xs text-gray-400">✔ {reason}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export function CreditCardsPage(): JSX.Element {
  const [cards, setCards] = useState<CreditCard[]>([])
  const [intelligence, setIntelligence] = useState<CardIntelligence[]>([])
  const [analytics, setAnalytics] = useState<CardPurchaseAnalytics | null>(null)
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

    const intelligenceResult = await window.api.creditCards.getAllIntelligence()
    if (intelligenceResult.success && intelligenceResult.data) {
      setIntelligence(intelligenceResult.data)
    }

    const analyticsResult = await window.api.creditCards.getPurchaseAnalytics()
    if (analyticsResult.success && analyticsResult.data) {
      setAnalytics(analyticsResult.data)
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
        <div className="flex items-center gap-3">
          {cards.length > 0 && <PurchaseAssistantModal />}
          <CardFormModal onSuccess={load} />
        </div>
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
          <>
            {intelligence.length >= 1 && <OpportunityCenter intelligence={intelligence} />}
            {analytics && <AnalyticsSummary analytics={analytics} />}
            {intelligence.length >= 2 && <CardComparator intelligence={intelligence} />}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {cards.map((card) => (
                <CardVisual
                  key={card.id}
                  card={card}
                  intelligence={intelligence.find((i) => i.cardId === card.id)}
                  onDelete={load}
                  onRefresh={load}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
