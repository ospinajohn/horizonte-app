import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as Dialog from '@radix-ui/react-dialog'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, Home, Car, Monitor, TrendingUp, Package, X, Building2 } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import type { PatrimonyData, Asset, AssetType } from '../../../../shared/types'

// ── Asset icons ────────────────────────────────────────────────────────────────
const ASSET_ICONS: Record<AssetType, React.ReactNode> = {
  REAL_ESTATE: <Home size={18} className="text-[#10B981]" />,
  VEHICLE: <Car size={18} className="text-blue-400" />,
  TECH: <Monitor size={18} className="text-purple-400" />,
  INVESTMENT: <TrendingUp size={18} className="text-amber-400" />,
  OTHER: <Package size={18} className="text-gray-400" />
}

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  REAL_ESTATE: 'Inmueble',
  VEHICLE: 'Vehículo',
  TECH: 'Tecnología',
  INVESTMENT: 'Inversión',
  OTHER: 'Otro'
}

// ── Asset Form Modal ────────────────────────────────────────────────────────────
const assetSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  type: z.enum(['REAL_ESTATE', 'VEHICLE', 'TECH', 'INVESTMENT', 'OTHER']),
  currentValue: z.coerce.number().positive(),
  acquisitionValue: z.coerce.number().min(0).default(0),
  acquisitionDate: z.string().optional(),
  description: z.string().optional()
})

type AssetFormData = z.infer<typeof assetSchema>

function AssetFormModal({ onSuccess }: { onSuccess: () => void }): JSX.Element {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: { type: 'OTHER', acquisitionValue: 0 }
  })

  const onSubmit = async (data: AssetFormData): Promise<void> => {
    setSaving(true)
    const result = await window.api.patrimony.createAsset({
      ...data,
      acquisitionDate: data.acquisitionDate ? new Date(data.acquisitionDate) : undefined
    })
    setSaving(false)
    if (result.success) { reset(); setOpen(false); onSuccess() }
  }

  const inputCls = 'w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#10B981]/50'
  const labelCls = 'text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 block'

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 text-gray-300 text-sm rounded-2xl hover:bg-white/10 border border-white/10 transition-colors">
          <Plus size={14} /> Agregar activo
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-[#121418] border border-white/5 rounded-[28px] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white">Nuevo Activo</Dialog.Title>
            <Dialog.Close className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <X size={14} />
            </Dialog.Close>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Nombre</label>
                <input {...register('name')} placeholder="Casa propia, Carro..." className={inputCls} />
                {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Tipo</label>
                <select {...register('type')} className={inputCls}>
                  {(Object.keys(ASSET_TYPE_LABELS) as AssetType[]).map((t) => (
                    <option key={t} value={t}>{ASSET_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Valor actual</label>
                <input {...register('currentValue')} type="number" placeholder="200000000" className={inputCls} />
                {errors.currentValue && <p className="text-rose-400 text-xs mt-1">{errors.currentValue.message}</p>}
              </div>
              <div>
                <label className={labelCls}>Valor adquisición</label>
                <input {...register('acquisitionValue')} type="number" placeholder="180000000" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Fecha adquisición</label>
              <input {...register('acquisitionDate')} type="date" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Descripción</label>
              <input {...register('description')} placeholder="Notas opcionales" className={inputCls} />
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

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any): JSX.Element | null {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-black/80 border border-white/10 backdrop-blur-md rounded-2xl px-4 py-3">
      <p className="text-[10px] text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-bold text-white">{formatCurrency(payload[0]?.value ?? 0)}</p>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export function PatrimonyPage(): JSX.Element {
  const [data, setData] = useState<PatrimonyData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (): Promise<void> => {
    setLoading(true)
    const result = await window.api.patrimony.getData()
    if (result.success && result.data) setData(result.data)
    setLoading(false)
    // Auto-snapshot al cargar
    window.api.patrimony.takeSnapshot().catch(() => {})
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin" />
      </div>
    )
  }

  const d = data ?? { totalAssets: 0, totalLiabilities: 0, netWorth: 0, assets: [], liabilities: [], creditsPending: 0, creditCardDebt: 0, history: [] }
  const netWorthColor = d.netWorth >= 0 ? 'text-[#10B981]' : 'text-rose-400'

  const chartData = d.history.map((h) => ({
    name: format(new Date(h.snapshotDate), 'MMM yy', { locale: es }),
    patrimonio: h.netWorth,
    activos: h.totalAssets,
    pasivos: h.totalLiabilities
  }))

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-12 py-8 shrink-0 flex items-end justify-between border-b border-white/5 bg-[#08090B]/80 backdrop-blur-md sticky top-0 z-10">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#10B981] mb-2">// Módulo</p>
          <h1 className="text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-white tracking-tight">
            Patrimonio Neto
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-12 py-8 custom-scrollbar">
        {/* Top layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Hero card */}
          <div className="bg-[#121418] border border-white/5 rounded-[28px] p-10 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#10B981]/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">Patrimonio Neto</p>
              <p className={cn('text-6xl font-["Plus_Jakarta_Sans",sans-serif] font-extrabold mb-6', netWorthColor)}>
                {formatCurrency(d.netWorth)}
              </p>

              {/* Equation */}
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Activos</p>
                  <p className="text-lg font-bold text-[#10B981]">{formatCurrency(d.totalAssets)}</p>
                </div>
                <span className="text-2xl text-gray-600">−</span>
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Pasivos</p>
                  <p className="text-lg font-bold text-rose-400">{formatCurrency(d.totalLiabilities)}</p>
                </div>
                <span className="text-2xl text-gray-600">=</span>
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Neto</p>
                  <p className={cn('text-lg font-bold', netWorthColor)}>{formatCurrency(d.netWorth)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* History chart */}
          <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">Evolución histórica</p>
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="1 8" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="patrimonio" stroke="#10B981" strokeWidth={2} fill="url(#netWorthGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-600 text-sm">
                Historial disponible después del primer mes
              </div>
            )}
          </div>
        </div>

        {/* Assets section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Activos</h2>
            <AssetFormModal onSuccess={load} />
          </div>
          {d.assets.length === 0 ? (
            <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8 text-center text-gray-600 text-sm">
              Sin activos registrados
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {d.assets.map((asset: Asset) => (
                <div key={asset.id} className="bg-[#121418] border border-white/5 rounded-[28px] p-6 hover:border-white/10 transition-all group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                      {ASSET_ICONS[asset.type]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{asset.name}</p>
                      <p className="text-[10px] text-gray-500">{ASSET_TYPE_LABELS[asset.type]}</p>
                    </div>
                  </div>
                  <p className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[#10B981]">
                    {formatCurrency(asset.currentValue)}
                  </p>
                  {asset.acquisitionValue > 0 && (
                    <p className={cn('text-xs mt-1', asset.currentValue > asset.acquisitionValue ? 'text-[#10B981]' : 'text-rose-400')}>
                      {asset.currentValue > asset.acquisitionValue ? '+' : ''}{formatCurrency(asset.currentValue - asset.acquisitionValue)} vs adquisición
                    </p>
                  )}
                  <button
                    onClick={async () => { await window.api.patrimony.deleteAsset(asset.id); load() }}
                    className="text-[10px] text-gray-700 hover:text-rose-400 mt-2 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Liabilities section */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Pasivos</h2>
          <div className="bg-[#121418] border border-white/5 rounded-[28px] p-6 space-y-3">
            {d.creditsPending > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-rose-400" />
                  <span className="text-sm text-gray-300">Créditos activos</span>
                </div>
                <span className="text-sm font-bold text-rose-400">{formatCurrency(d.creditsPending)}</span>
              </div>
            )}
            {d.creditCardDebt > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-rose-400" />
                  <span className="text-sm text-gray-300">Tarjetas de crédito</span>
                </div>
                <span className="text-sm font-bold text-rose-400">{formatCurrency(d.creditCardDebt)}</span>
              </div>
            )}
            {d.liabilities.map((l: any) => (
              <div key={l.id} className="flex justify-between items-center py-2 border-b border-white/5">
                <div>
                  <span className="text-sm text-gray-300">{l.name}</span>
                  {l.creditor && <span className="text-xs text-gray-600 ml-2">({l.creditor})</span>}
                </div>
                <span className="text-sm font-bold text-rose-400">{formatCurrency(l.amount)}</span>
              </div>
            ))}
            {d.totalLiabilities === 0 && (
              <p className="text-sm text-gray-600 text-center py-4">Sin pasivos registrados</p>
            )}
            <div className="flex justify-between items-center pt-3">
              <span className="text-sm font-bold text-white">Total pasivos</span>
              <span className="text-base font-bold text-rose-400">{formatCurrency(d.totalLiabilities)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
