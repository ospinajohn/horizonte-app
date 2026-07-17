import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  DollarSign, Building2, ShoppingCart, BriefcaseBusiness, TrendingDown, FlaskConical,
  ChevronDown, ChevronUp, CheckCircle, AlertTriangle, XCircle, Save
} from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import type { SimulationParams, SimulationResult, SimulationScenarioType } from '../../../../shared/types'

// ── Scenario config ───────────────────────────────────────────────────────────
interface ScenarioConfig {
  type: SimulationScenarioType
  label: string
  description: string
  icon: React.ReactNode
  color: string
}

const SCENARIOS: ScenarioConfig[] = [
  { type: 'SALARY_CHANGE', label: 'Cambio de salario', description: 'Aumento o reducción de ingresos', icon: <DollarSign size={22} />, color: '#10B981' },
  { type: 'NEW_CREDIT', label: 'Nuevo crédito', description: 'Impacto de una nueva cuota mensual', icon: <Building2 size={22} />, color: '#60A5FA' },
  { type: 'BIG_PURCHASE', label: 'Compra importante', description: 'Desembolso de efectivo grande', icon: <ShoppingCart size={22} />, color: '#A78BFA' },
  { type: 'UNEMPLOYMENT', label: 'Desempleo', description: 'Sin ingresos por N meses', icon: <BriefcaseBusiness size={22} />, color: '#F59E0B' },
  { type: 'EXPENSE_CHANGE', label: 'Cambio de gastos', description: 'Ajuste % en gastos mensuales', icon: <TrendingDown size={22} />, color: '#F43F5E' },
  { type: 'OTHER', label: 'Otro escenario', description: 'Escenario personalizado', icon: <FlaskConical size={22} />, color: '#6B7280' }
]

// ── Params schema per type ────────────────────────────────────────────────────
const paramsSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  salaryChange: z.coerce.number().optional(),
  newCreditMonthlyPayment: z.coerce.number().optional(),
  newCreditMonths: z.coerce.number().optional(),
  bigPurchaseAmount: z.coerce.number().optional(),
  unemploymentMonths: z.coerce.number().int().min(1).optional(),
  expenseChangePercent: z.coerce.number().optional()
})

type ParamsFormData = z.infer<typeof paramsSchema>

// ── Can Afford badge ──────────────────────────────────────────────────────────
function CanAffordBadge({ canAfford, debtRatio }: { canAfford: boolean; debtRatio: number }): JSX.Element {
  if (canAfford) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
        <CheckCircle size={16} className="text-[#10B981]" />
        <span className="text-sm font-bold text-[#10B981]">Viable</span>
      </div>
    )
  }
  if (debtRatio <= 45) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
        <AlertTriangle size={16} className="text-amber-500" />
        <span className="text-sm font-bold text-amber-500">Con riesgo</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
      <XCircle size={16} className="text-rose-400" />
      <span className="text-sm font-bold text-rose-400">No viable</span>
    </div>
  )
}

// ── Saved Scenarios ───────────────────────────────────────────────────────────
function SavedScenarios(): JSX.Element {
  const [scenarios, setScenarios] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const load = async (): Promise<void> => {
    setLoading(true)
    const result = await window.api.simulator.getSavedScenarios()
    if (result.success && result.data) setScenarios(result.data)
    setLoading(false)
  }

  const toggle = (): void => {
    if (!open) load()
    setOpen((v) => !v)
  }

  return (
    <div className="bg-[#121418] border border-white/5 rounded-[28px] p-6 mt-8">
      <button onClick={toggle} className="w-full flex items-center justify-between">
        <span className="text-sm font-bold text-white">Escenarios guardados</span>
        {open ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          {loading && <p className="text-sm text-gray-500 text-center py-4">Cargando...</p>}
          {!loading && scenarios.length === 0 && (
            <p className="text-sm text-gray-600 text-center py-4">Sin escenarios guardados</p>
          )}
          {scenarios.map((s) => {
            const result = s.results ? JSON.parse(s.results) as SimulationResult : null
            return (
              <div key={s.id} className="bg-black/20 rounded-2xl p-4 border border-white/5">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-bold text-white">{s.name}</p>
                  <span className="text-[10px] text-gray-500">
                    {format(new Date(s.createdAt), "d MMM yyyy", { locale: es })}
                  </span>
                </div>
                {s.description && <p className="text-xs text-gray-400 mb-2">{s.description}</p>}
                {result && (
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-gray-500">3 meses</p>
                      <p className={result.projectedBalance3M >= 0 ? 'text-[#10B981] font-bold' : 'text-rose-400 font-bold'}>
                        {formatCurrency(result.projectedBalance3M)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">12 meses</p>
                      <p className={result.projectedBalance12M >= 0 ? 'text-[#10B981] font-bold' : 'text-rose-400 font-bold'}>
                        {formatCurrency(result.projectedBalance12M)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Ratio deuda</p>
                      <p className="text-white font-bold">{result.debtRatio.toFixed(1)}%</p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export function SimulatorPage(): JSX.Element {
  const [selectedType, setSelectedType] = useState<SimulationScenarioType | null>(null)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [simulating, setSimulating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastParams, setLastParams] = useState<SimulationParams | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ParamsFormData>({
    resolver: zodResolver(paramsSchema),
    defaultValues: { name: '' }
  })

  const onSimulate = async (data: ParamsFormData): Promise<void> => {
    if (!selectedType) return
    setSimulating(true)
    const params: SimulationParams = {
      type: selectedType,
      name: data.name,
      salaryChange: data.salaryChange,
      newCreditMonthlyPayment: data.newCreditMonthlyPayment,
      newCreditMonths: data.newCreditMonths,
      bigPurchaseAmount: data.bigPurchaseAmount,
      unemploymentMonths: data.unemploymentMonths,
      expenseChangePercent: data.expenseChangePercent
    }
    setLastParams(params)
    const res = await window.api.simulator.simulate(params)
    if (res.success && res.data) setResult(res.data)
    setSimulating(false)
  }

  const saveScenario = async (): Promise<void> => {
    if (!lastParams || !result) return
    setSaving(true)
    await window.api.simulator.saveScenario(lastParams, result)
    setSaving(false)
  }

  const selectScenario = (type: SimulationScenarioType): void => {
    setSelectedType(type)
    setResult(null)
    reset()
  }

  const inputCls = 'w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#10B981]/50'
  const labelCls = 'text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 block'

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-12 py-8 shrink-0 flex items-end justify-between border-b border-white/5 bg-[#08090B]/80 backdrop-blur-md sticky top-0 z-10">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#10B981] mb-2">// Laboratorio</p>
          <h1 className="text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-white tracking-tight">
            Simulador Financiero
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-12 py-8 custom-scrollbar">
        {/* Scenario selection */}
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-4">Selecciona un escenario para simular:</p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {SCENARIOS.map((s) => (
              <button
                key={s.type}
                onClick={() => selectScenario(s.type)}
                className={cn(
                  'bg-[#121418] border rounded-[24px] p-6 text-left transition-all duration-200 hover:border-white/20',
                  selectedType === s.type
                    ? 'border-[#10B981]/40 bg-[#10B981]/5'
                    : 'border-white/5'
                )}
              >
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: `${s.color}15` }}>
                  <span style={{ color: s.color }}>{s.icon}</span>
                </div>
                <p className="text-sm font-bold text-white">{s.label}</p>
                <p className="text-xs text-gray-500 mt-1">{s.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Params panel */}
        {selectedType && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">Parámetros del escenario</p>
              <form onSubmit={handleSubmit(onSimulate)} className="space-y-4">
                <div>
                  <label className={labelCls}>Nombre del escenario</label>
                  <input {...register('name')} placeholder="Ej: Nuevo crédito vehículo" className={inputCls} />
                  {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name.message}</p>}
                </div>

                {selectedType === 'SALARY_CHANGE' && (
                  <div>
                    <label className={labelCls}>% de cambio en salario (positivo=aumento)</label>
                    <input {...register('salaryChange')} type="number" step="0.5" placeholder="+15 o -20" className={inputCls} />
                  </div>
                )}

                {selectedType === 'NEW_CREDIT' && (
                  <>
                    <div>
                      <label className={labelCls}>Cuota mensual estimada</label>
                      <input {...register('newCreditMonthlyPayment')} type="number" placeholder="500000" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Meses del crédito</label>
                      <input {...register('newCreditMonths')} type="number" placeholder="36" className={inputCls} />
                    </div>
                  </>
                )}

                {selectedType === 'BIG_PURCHASE' && (
                  <div>
                    <label className={labelCls}>Monto de la compra</label>
                    <input {...register('bigPurchaseAmount')} type="number" placeholder="5000000" className={inputCls} />
                  </div>
                )}

                {selectedType === 'UNEMPLOYMENT' && (
                  <div>
                    <label className={labelCls}>Meses sin ingreso</label>
                    <input {...register('unemploymentMonths')} type="number" min="1" max="24" placeholder="3" className={inputCls} />
                  </div>
                )}

                {selectedType === 'EXPENSE_CHANGE' && (
                  <div>
                    <label className={labelCls}>% de cambio en gastos</label>
                    <input {...register('expenseChangePercent')} type="number" step="0.5" placeholder="+10 o -15" className={inputCls} />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={simulating}
                  className="w-full h-11 rounded-2xl bg-[#10B981] text-black font-bold text-sm hover:bg-[#0ea371] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FlaskConical size={16} />
                  {simulating ? 'Simulando...' : 'Simular escenario'}
                </button>
              </form>
            </div>

            {/* Results panel */}
            {result && (
              <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Resultado</p>
                  <CanAffordBadge canAfford={result.canAfford} debtRatio={result.debtRatio} />
                </div>

                {/* Projected balances */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { label: '3 meses', value: result.projectedBalance3M },
                    { label: '6 meses', value: result.projectedBalance6M },
                    { label: '12 meses', value: result.projectedBalance12M }
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-black/20 rounded-2xl p-3 border border-white/5">
                      <p className="text-[10px] text-gray-500 mb-1">{label}</p>
                      <p className={cn('text-sm font-bold', value >= 0 ? 'text-[#10B981]' : 'text-rose-400')}>
                        {formatCurrency(value)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Key metrics */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Flujo mensual</span>
                    <span className={cn('font-bold', result.monthlyCashflow >= 0 ? 'text-[#10B981]' : 'text-rose-400')}>
                      {formatCurrency(result.monthlyCashflow)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Capacidad de ahorro</span>
                    <span className="font-bold text-white">{formatCurrency(result.savingsCapacity)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Ratio de deuda</span>
                    <span className={cn('font-bold', result.debtRatio < 30 ? 'text-[#10B981]' : result.debtRatio < 40 ? 'text-amber-400' : 'text-rose-400')}>
                      {result.debtRatio.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Impact summary */}
                <div className="bg-black/20 rounded-2xl p-4 border border-white/5 mb-4">
                  <p className="text-xs text-gray-400 leading-relaxed">{result.impactSummary}</p>
                </div>

                {/* Recommendations */}
                <div className="space-y-2 mb-4">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                      <span className="text-[#10B981] mt-0.5 shrink-0">•</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={saveScenario}
                  disabled={saving}
                  className="w-full h-10 rounded-2xl bg-white/5 border border-white/10 text-gray-300 text-sm font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={14} />
                  {saving ? 'Guardando...' : 'Guardar escenario'}
                </button>
              </div>
            )}
          </div>
        )}

        <SavedScenarios />
      </div>
    </div>
  )
}
