import { useState, useEffect, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as Dialog from '@radix-ui/react-dialog'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, Building2, X, ChevronDown, ChevronUp } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/input'
import type { Credit, AmortizationRow } from '../../../../shared/types'

// ── Zod schema ───────────────────────────────────────────────────────────────
const creditSchema = z.object({
  entityName: z.string().min(1, 'Nombre de entidad requerido'),
  totalAmount: z.coerce.number().positive('Debe ser positivo'),
  pendingAmount: z.coerce.number().positive('Debe ser positivo'),
  annualRate: z.coerce.number().min(0).max(100, 'Tasa máxima 100%'),
  monthlyPayment: z.coerce.number().min(0),
  paymentDay: z.coerce.number().min(1).max(31),
  totalInstallments: z.coerce.number().int().min(1),
  paidInstallments: z.coerce.number().int().min(0).default(0),
  status: z.enum(['ACTIVE', 'PAID', 'OVERDUE']).default('ACTIVE'),
  startDate: z.string().min(1, 'Fecha requerida'),
  notes: z.string().optional()
})

type CreditFormData = z.infer<typeof creditSchema>

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }): JSX.Element {
  const map: Record<string, { label: string; cls: string }> = {
    ACTIVE: { label: 'Activo', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    PAID: { label: 'Pagado', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    OVERDUE: { label: 'En mora', cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20' }
  }
  const { label, cls } = map[status] ?? map.ACTIVE
  return (
    <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xl border', cls)}>
      {label}
    </span>
  )
}

// ── Credit Form Modal ─────────────────────────────────────────────────────────
function CreditFormModal({ onSuccess }: { onSuccess: () => void }): JSX.Element {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<CreditFormData>({
    resolver: zodResolver(creditSchema),
    defaultValues: { paidInstallments: 0, status: 'ACTIVE', monthlyPayment: 0 }
  })

  const onSubmit = async (data: CreditFormData): Promise<void> => {
    setSaving(true)
    const result = await window.api.credits.create({
      ...data,
      startDate: new Date(data.startDate),
      notes: data.notes || undefined
    })
    setSaving(false)
    if (result.success) {
      reset()
      setOpen(false)
      onSuccess()
    }
  }

  const inputCls = 'w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#10B981]/50'
  const labelCls = 'text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 block'

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-[#10B981] text-black font-bold text-sm rounded-2xl hover:bg-[#0ea371] transition-colors shadow-lg shadow-[#10B981]/20">
          <Plus size={16} />
          Nuevo Crédito
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[85vh] bg-[#121418] border border-white/5 rounded-[28px] shadow-2xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-8 pb-0 shrink-0">
            <Dialog.Title className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white">
              Nuevo Crédito
            </Dialog.Title>
            <Dialog.Close className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <X size={14} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-6 space-y-4">
            <div>
              <label className={labelCls}>Entidad / Banco</label>
              <input {...register('entityName')} placeholder="Bancolombia, Davivienda..." className={inputCls} />
              {errors.entityName && <p className="text-rose-400 text-xs mt-1">{errors.entityName.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Valor total</label>
                <input {...register('totalAmount')} type="number" placeholder="10000000" className={inputCls} />
                {errors.totalAmount && <p className="text-rose-400 text-xs mt-1">{errors.totalAmount.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Saldo pendiente</label>
                <input {...register('pendingAmount')} type="number" placeholder="8000000" className={inputCls} />
                {errors.pendingAmount && <p className="text-rose-400 text-xs mt-1">{errors.pendingAmount.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Tasa EA (%)</label>
                <input {...register('annualRate')} type="number" step="0.01" placeholder="18.5" className={inputCls} />
                {errors.annualRate && <p className="text-rose-400 text-xs mt-1">{errors.annualRate.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Cuota mensual (0=auto)</label>
                <input {...register('monthlyPayment')} type="number" placeholder="0" className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Día de pago</label>
                <input {...register('paymentDay')} type="number" min="1" max="31" placeholder="15" className={inputCls} />
                {errors.paymentDay && <p className="text-rose-400 text-xs mt-1">{errors.paymentDay.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Cuotas totales</label>
                <input {...register('totalInstallments')} type="number" placeholder="36" className={inputCls} />
                {errors.totalInstallments && <p className="text-rose-400 text-xs mt-1">{errors.totalInstallments.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Cuotas pagadas</label>
                <input {...register('paidInstallments')} type="number" min="0" placeholder="0" className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Fecha inicio</label>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ? new Date(field.value + 'T00:00:00') : null}
                      onChange={(d) => field.onChange(d ? format(d, 'yyyy-MM-dd') : '')}
                    />
                  )}
                />
                {errors.startDate && <p className="text-rose-400 text-xs mt-1">{errors.startDate.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Estado</label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Activo</SelectItem>
                        <SelectItem value="PAID">Pagado</SelectItem>
                        <SelectItem value="OVERDUE">En mora</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Notas (opcional)</label>
              <textarea {...register('notes')} rows={2} placeholder="Observaciones..." className={cn(inputCls, 'resize-none')} />
            </div>

            <div className="flex gap-3 pt-2">
              <Dialog.Close className="flex-1 h-11 rounded-2xl bg-white/5 border border-white/10 text-gray-400 text-sm font-medium hover:text-white transition-colors">
                Cancelar
              </Dialog.Close>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 h-11 rounded-2xl bg-[#10B981] text-black font-bold text-sm hover:bg-[#0ea371] transition-colors disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar Crédito'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ── Amortization Modal ────────────────────────────────────────────────────────
function AmortizationModal({ creditId, entityName }: { creditId: number; entityName: string }): JSX.Element {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<AmortizationRow[]>([])
  const [loading, setLoading] = useState(false)

  const loadRows = useCallback(async (): Promise<void> => {
    setLoading(true)
    const result = await window.api.credits.getById(creditId)
    if (result.success && result.data?.amortizationRows) {
      setRows(result.data.amortizationRows)
    }
    setLoading(false)
  }, [creditId])

  useEffect(() => {
    if (open) loadRows()
  }, [open, loadRows])

  const paidRows = rows.filter((r) => r.isPaid)
  const totalPaid = paidRows.reduce((s, r) => s + r.payment, 0)
  const totalInterest = paidRows.reduce((s, r) => s + r.interest, 0)
  const totalInterestAll = rows.reduce((s, r) => s + r.interest, 0)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="text-xs text-gray-400 hover:text-[#10B981] transition-colors flex items-center gap-1">
          Ver amortización <ChevronDown size={12} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-3xl bg-[#121418] border border-white/5 rounded-[28px] p-8 shadow-2xl max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <div>
              <Dialog.Title className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white">
                Tabla de Amortización
              </Dialog.Title>
              <p className="text-sm text-gray-500 mt-0.5">{entityName}</p>
            </div>
            <Dialog.Close className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <X size={14} />
            </Dialog.Close>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[#121418]">
                    <tr className="border-b border-white/5">
                      {['#', 'Fecha', 'Cuota', 'Capital', 'Interés', 'Saldo'].map((h) => (
                        <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-500 pb-3 pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const isCurrentRow = !row.isPaid && rows.filter((r) => !r.isPaid)[0]?.id === row.id
                      return (
                        <tr
                          key={row.id}
                          className={cn(
                            'border-b border-white/3 transition-colors',
                            row.isPaid ? 'opacity-40' : '',
                            isCurrentRow ? 'bg-emerald-500/5' : 'hover:bg-white/2'
                          )}
                        >
                          <td className={cn('py-2 pr-4 font-mono text-xs', isCurrentRow ? 'text-[#10B981] font-bold' : 'text-gray-400')}>
                            {row.installment}
                          </td>
                          <td className="py-2 pr-4 text-gray-300 text-xs">
                            {format(new Date(row.dueDate), 'dd MMM yyyy', { locale: es })}
                          </td>
                          <td className="py-2 pr-4 text-white font-medium">
                            {formatCurrency(row.payment)}
                          </td>
                          <td className="py-2 pr-4 text-blue-400">
                            {formatCurrency(row.principal)}
                          </td>
                          <td className="py-2 pr-4 text-rose-400">
                            {formatCurrency(row.interest)}
                          </td>
                          <td className="py-2 text-gray-300">
                            {formatCurrency(row.balance)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totales */}
              <div className="pt-4 mt-4 border-t border-white/5 grid grid-cols-3 gap-4 shrink-0">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Total pagado</p>
                  <p className="text-lg font-bold text-white">{formatCurrency(totalPaid)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Interés pagado</p>
                  <p className="text-lg font-bold text-rose-400">{formatCurrency(totalInterest)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Interés total crédito</p>
                  <p className="text-lg font-bold text-amber-400">{formatCurrency(totalInterestAll)}</p>
                </div>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ── Credit Card Component ─────────────────────────────────────────────────────
function CreditCard({ credit, onDelete }: { credit: Credit; onDelete: () => void }): JSX.Element {
  const [expanded, setExpanded] = useState(false)
  const progressPct = credit.totalInstallments > 0
    ? (credit.paidInstallments / credit.totalInstallments) * 100
    : 0

  return (
    <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8 hover:border-white/10 transition-all duration-200">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#10B981]/10 flex items-center justify-center">
            <Building2 size={20} className="text-[#10B981]" />
          </div>
          <div>
            <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white text-base">
              {credit.entityName}
            </h3>
            <StatusBadge status={credit.status} />
          </div>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-gray-600 hover:text-white transition-colors"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Progreso</span>
          <span className="text-xs text-gray-400">{credit.paidInstallments} / {credit.totalInstallments} cuotas</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#10B981] rounded-full transition-all duration-1000"
            style={{ width: `${progressPct}%`, boxShadow: '0 0 8px rgba(16,185,129,0.5)' }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Cuota mensual</p>
          <p className="text-base font-bold text-white">{formatCurrency(credit.monthlyPayment)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Saldo pendiente</p>
          <p className="text-base font-bold text-rose-400">{formatCurrency(credit.pendingAmount)}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Tasa EA</p>
          <p className="text-base font-bold text-amber-400">{credit.annualRate.toFixed(2)}%</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <AmortizationModal creditId={credit.id} entityName={credit.entityName} />
        <button
          onClick={async () => {
            await window.api.credits.delete(credit.id)
            onDelete()
          }}
          className="text-xs text-gray-600 hover:text-rose-400 transition-colors"
        >
          Eliminar
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Fecha inicio</span>
            <span className="text-gray-300">{format(new Date(credit.startDate), 'dd MMM yyyy', { locale: es })}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Día de pago</span>
            <span className="text-gray-300">Día {credit.paymentDay}</span>
          </div>
          {credit.notes && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Notas</span>
              <span className="text-gray-300 text-right max-w-xs">{credit.notes}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function CreditsPage(): JSX.Element {
  const [credits, setCredits] = useState<Credit[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (): Promise<void> => {
    setLoading(true)
    const result = await window.api.credits.getAll()
    if (result.success && result.data) setCredits(result.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const totalDebt = credits
    .filter((c) => c.status === 'ACTIVE')
    .reduce((sum, c) => sum + c.pendingAmount, 0)
  const activeCount = credits.filter((c) => c.status === 'ACTIVE').length

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-12 py-8 shrink-0 flex items-end justify-between border-b border-white/5 bg-[#08090B]/80 backdrop-blur-md sticky top-0 z-10">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#10B981] mb-2">// Módulo</p>
          <h1 className="text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-white tracking-tight">
            Créditos
          </h1>
        </div>
        <CreditFormModal onSuccess={load} />
      </div>

      <div className="flex-1 overflow-y-auto px-12 py-8 custom-scrollbar">
        {/* Summary card */}
        <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8 mb-8 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#10B981]/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative flex gap-12">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Deuda activa total</p>
              <p className="text-5xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-rose-400">
                {formatCurrency(totalDebt)}
              </p>
            </div>
            <div className="h-px w-px bg-white/5 mx-4" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Créditos activos</p>
              <p className="text-5xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-white">
                {activeCount}
              </p>
            </div>
          </div>
        </div>

        {/* Credits list */}
        {credits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-[#10B981]/10 rounded-full flex items-center justify-center mb-4 border border-[#10B981]/20">
              <Building2 size={28} className="text-[#10B981]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sin créditos registrados</h3>
            <p className="text-sm text-gray-500 max-w-xs">
              Registra tus créditos para ver la tabla de amortización y el impacto en tu flujo de caja.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {credits.map((credit) => (
              <CreditCard key={credit.id} credit={credit} onDelete={load} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
