import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  DollarSign, Building2, ShoppingCart, BriefcaseBusiness, TrendingDown, FlaskConical,
  ChevronDown, ChevronUp, CheckCircle, AlertTriangle, XCircle, Save, Wallet, Shield
} from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { PageHeader } from '@/components/ui/PageHeader'
import type { SimulationParams, SimulationResult, SimulationScenarioType, DebtCapacityData, EmergencyFundData } from '@shared/types'

// ── Types ─────────────────────────────────────────────────────────────────────

type TabName = 'simulador' | 'deuda' | 'emergencia'

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

const TABS: { name: TabName; label: string }[] = [
  { name: 'simulador', label: 'Simulador' },
  { name: 'deuda', label: 'Capacidad de Deuda' },
  { name: 'emergencia', label: 'Fondo de Emergencia' }
]

// ── Tab bar ───────────────────────────────────────────────────────────────────

function TabBar({ active, onChange }: { active: TabName; onChange: (v: TabName) => void }): JSX.Element {
  return (
    <div className="flex items-center bg-[#0F1115] border border-white/5 rounded-2xl p-1 w-fit">
      {TABS.map((tab) => (
        <button
          key={tab.name}
          onClick={() => onChange(tab.name)}
          className={cn(
            'px-5 py-2 text-sm font-bold rounded-xl transition-all duration-200',
            active === tab.name
              ? 'bg-[#10B981] text-black'
              : 'text-gray-400 hover:text-white'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ── CanAffordBadge ────────────────────────────────────────────────────────────

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

// ── Simulator content ─────────────────────────────────────────────────────────

function SimulatorTab(): JSX.Element {
  const [selectedType, setSelectedType] = useState<SimulationScenarioType | null>(null)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [simulating, setSimulating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastParams, setLastParams] = useState<SimulationParams | null>(null)
  const [savedScenarios, setSavedScenarios] = useState<any[]>([])
  const [savedOpen, setSavedOpen] = useState(false)
  const [savedLoading, setSavedLoading] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ParamsFormData>({
    resolver: zodResolver(paramsSchema),
    defaultValues: { name: '' }
  })

  const loadSaved = async (): Promise<void> => {
    setSavedLoading(true)
    const res = await window.api.simulator.getSavedScenarios()
    if (res.success && res.data) setSavedScenarios(res.data)
    setSavedLoading(false)
  }

  const toggleSaved = (): void => {
    if (!savedOpen) loadSaved()
    setSavedOpen((v) => !v)
  }

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
    <div className="space-y-8">
      {/* Scenario selection */}
      <div>
        <p className="text-sm text-gray-400 mb-4">Selecciona un escenario para simular:</p>
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

      {/* Params + results */}
      {selectedType && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

          {result && (
            <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8">
              <div className="flex items-center justify-between mb-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Resultado</p>
                <CanAffordBadge canAfford={result.canAfford} debtRatio={result.debtRatio} />
              </div>

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

                {/* Key metrics */}
                <div className="col-span-3 space-y-2 mb-2">
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

                <div className="col-span-3 bg-black/20 rounded-2xl p-4 border border-white/5">
                  <p className="text-xs text-gray-400 leading-relaxed">{result.impactSummary}</p>
                </div>

                <div className="col-span-3 space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                      <span className="text-[#10B981] mt-0.5 shrink-0">•</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>

                <div className="col-span-3">
                  <button
                    onClick={saveScenario}
                    disabled={saving}
                    className="w-full h-10 rounded-2xl bg-white/5 border border-white/10 text-gray-300 text-sm font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save size={14} />
                    {saving ? 'Guardando...' : 'Guardar escenario'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Saved scenarios */}
      <div className="bg-[#121418] border border-white/5 rounded-[28px] p-6">
        <button onClick={toggleSaved} className="w-full flex items-center justify-between">
          <span className="text-sm font-bold text-white">Escenarios guardados</span>
          {savedOpen ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
        </button>

        {savedOpen && (
          <div className="mt-4 space-y-3">
            {savedLoading && <p className="text-sm text-gray-500 text-center py-4">Cargando...</p>}
            {!savedLoading && savedScenarios.length === 0 && (
              <p className="text-sm text-gray-600 text-center py-4">Sin escenarios guardados</p>
            )}
            {savedScenarios.map((s) => {
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
    </div>
  )
}

// ── Debt Gauge ────────────────────────────────────────────────────────────────

function DebtGauge({ percent }: { percent: number }): JSX.Element {
  const clampedPct = Math.min(Math.max(percent, 0), 100)
  const r = 80
  const cx = 100
  const cy = 100
  const lowAngle = (30 / 100) * Math.PI
  const midAngle = (40 / 100) * Math.PI
  const progressAngle = (clampedPct / 100) * Math.PI

  const toPoint = (angle: number): { x: number; y: number } => ({
    x: cx - r * Math.cos(angle),
    y: cy - r * Math.sin(angle)
  })

  const start = toPoint(Math.PI)
  const lowEnd = toPoint(Math.PI - lowAngle)
  const midEnd = toPoint(Math.PI - midAngle)
  const arcEnd = toPoint(Math.PI - progressAngle)

  const needleAngle = Math.PI - progressAngle
  const needleX = cx + 60 * Math.cos(needleAngle)
  const needleY = cy - 60 * Math.sin(needleAngle)

  const arcPath = (from: { x: number; y: number }, to: { x: number; y: number }): string =>
    `M ${from.x} ${from.y} A ${r} ${r} 0 0 1 ${to.x} ${to.y}`

  let gaugeColor = '#10B981'
  let label = 'Bajo riesgo'
  if (clampedPct >= 40) { gaugeColor = '#F43F5E'; label = 'Alto riesgo' }
  else if (clampedPct >= 30) { gaugeColor = '#F59E0B'; label = 'Riesgo medio' }

  return (
    <div className="flex flex-col items-center">
      <svg width="220" height="130" viewBox="0 0 200 115">
        <path d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${toPoint(0).x} ${toPoint(0).y}`} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" strokeLinecap="round" />
        <path d={arcPath(start, lowEnd)} fill="none" stroke="#10B981" strokeWidth="10" strokeLinecap="round" opacity="0.3" />
        <path d={arcPath(lowEnd, midEnd)} fill="none" stroke="#F59E0B" strokeWidth="10" strokeLinecap="round" opacity="0.3" />
        <path d={arcPath(midEnd, toPoint(0))} fill="none" stroke="#F43F5E" strokeWidth="10" strokeLinecap="round" opacity="0.3" />
        <path d={arcPath(start, arcEnd)} fill="none" stroke={gaugeColor} strokeWidth="10" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${gaugeColor})` }} />
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        <circle cx={cx} cy={cy} r={4} fill="white" opacity="0.8" />
        <text x={cx} y={cy - 12} textAnchor="middle" fill="white" fontSize="22" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="bold">
          {clampedPct.toFixed(1)}%
        </text>
      </svg>
      <div
        className="text-sm font-bold px-4 py-1.5 rounded-full border mt-1"
        style={{ color: gaugeColor, borderColor: `${gaugeColor}30`, backgroundColor: `${gaugeColor}10` }}
      >
        {label}
      </div>
    </div>
  )
}

// ── Debt Calculator ───────────────────────────────────────────────────────────

function DebtCalculator({ data }: { data: DebtCapacityData }): JSX.Element {
  const [newPayment, setNewPayment] = useState('')

  const payment = parseFloat(newPayment) || 0
  const newTotal = data.totalMonthlyDebt + payment
  const newRatio = data.monthlyIncome > 0 ? (newTotal / data.monthlyIncome) * 100 : 0

  let resultColor = 'text-[#10B981]'
  let resultText = 'Podrías asumir esta cuota'
  let resultBg = 'bg-emerald-500/10 border-emerald-500/20'
  if (newRatio >= 40) {
    resultColor = 'text-rose-400'
    resultText = 'Esta cuota excede tu capacidad recomendada'
    resultBg = 'bg-rose-500/10 border-rose-500/20'
  } else if (newRatio >= 30) {
    resultColor = 'text-amber-400'
    resultText = 'Cuota asumible pero en zona de precaución'
    resultBg = 'bg-amber-500/10 border-amber-500/20'
  }

  return (
    <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">Calculadora interactiva</p>
      <p className="text-sm text-gray-400 mb-4">¿Cuánto sería la nueva cuota mensual?</p>
      <input
        type="number"
        value={newPayment}
        onChange={(e) => setNewPayment(e.target.value)}
        placeholder="Ej: 400000"
        className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#10B981]/50 mb-4"
      />
      {payment > 0 && (
        <div className={cn('rounded-2xl p-4 border', resultBg)}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Nuevo ratio de deuda</span>
            <span className={cn('text-lg font-bold', resultColor)}>{newRatio.toFixed(1)}%</span>
          </div>
          <p className={cn('text-sm font-bold', resultColor)}>{resultText}</p>
          <p className="text-xs text-gray-500 mt-1">
            Cuota máxima disponible: {formatCurrency(Math.max(data.availableCapacity, 0))}
          </p>
        </div>
      )}
    </div>
  )
}

// ── Debt Tab ──────────────────────────────────────────────────────────────────

function DebtTab(): JSX.Element {
  const [data, setData] = useState<DebtCapacityData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (): Promise<void> => {
    setLoading(true)
    const result = await window.api.debtCapacity.getData()
    if (result.success && result.data) setData(result.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin" />
      </div>
    )
  }

  const d = data ?? {
    monthlyIncome: 0,
    totalMonthlyDebt: 0,
    debtRatioPercent: 0,
    maxRecommendedPayment: 0,
    availableCapacity: 0,
    riskLevel: 'LOW' as const,
    creditDetails: [],
    cardDetails: []
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#121418] border border-white/5 rounded-[28px] p-10 flex flex-col items-center justify-center">
          <DebtGauge percent={d.debtRatioPercent} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-6 mb-1 text-center">% comprometido de tus ingresos</p>
        </div>

        <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8 space-y-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Ingreso mensual promedio</p>
            <p className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[#10B981]">{formatCurrency(d.monthlyIncome)}</p>
          </div>

          <div className="h-px bg-white/5" />

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Deuda mensual actual</p>
            <p className="text-xl font-bold text-rose-400 mb-2">{formatCurrency(d.totalMonthlyDebt)}</p>
            {d.creditDetails.map((c, i) => (
              <div key={i} className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{c.name}</span>
                <span>{formatCurrency(c.monthlyPayment)}</span>
              </div>
            ))}
            {d.cardDetails.map((c, i) => (
              <div key={i} className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{c.name} (pago mínimo)</span>
                <span>{formatCurrency(c.minimumPayment)}</span>
              </div>
            ))}
          </div>

          <div className="h-px bg-white/5" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Cuota máx. recomendada (30%)</p>
              <p className="text-base font-bold text-amber-400">{formatCurrency(d.maxRecommendedPayment)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Capacidad disponible</p>
              <p className={cn('text-base font-bold', d.availableCapacity > 0 ? 'text-[#10B981]' : 'text-rose-400')}>
                {formatCurrency(Math.max(d.availableCapacity, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      <DebtCalculator data={d} />
    </div>
  )
}

// ── Progress Ring ─────────────────────────────────────────────────────────────

function ProgressRing({ monthsCovered, targetMonths }: { monthsCovered: number; targetMonths: number }): JSX.Element {
  const r = 80
  const cx = 100
  const cy = 100
  const circumference = 2 * Math.PI * r
  const pct = Math.min(monthsCovered / targetMonths, 1)
  const strokeDashoffset = circumference - pct * circumference

  let strokeColor = '#F43F5E'
  let centerTextColor = 'text-rose-400'
  if (monthsCovered >= targetMonths) { strokeColor = '#10B981'; centerTextColor = 'text-[#10B981]' }
  else if (monthsCovered >= targetMonths * 0.5) { strokeColor = '#F59E0B'; centerTextColor = 'text-amber-400' }

  return (
    <div className="relative flex items-center justify-center">
      <svg width="220" height="220" viewBox="0 0 200 200">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
        <circle cx={cx} cy={cy - r} r="5" fill={strokeColor} opacity="0.6" />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 100 100)"
          style={{
            transition: 'stroke-dashoffset 1.5s ease',
            filter: `drop-shadow(0 0 8px ${strokeColor})`
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-5xl font-["Plus_Jakarta_Sans",sans-serif] font-extrabold', centerTextColor)}>
          {monthsCovered.toFixed(1)}
        </span>
        <span className="text-xs text-gray-500 mt-1">meses cubiertos</span>
        <span className="text-[10px] text-gray-600 mt-0.5">meta: {targetMonths} meses</span>
      </div>
    </div>
  )
}

// ── Emergency Tab ─────────────────────────────────────────────────────────────

function EmergencyTab(): JSX.Element {
  const [data, setData] = useState<EmergencyFundData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (): Promise<void> => {
    setLoading(true)
    const result = await window.api.emergencyFund.getData()
    if (result.success && result.data) setData(result.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin" />
      </div>
    )
  }

  const d = data ?? {
    monthlyExpenseAvg: 0,
    emergencyFundBalance: 0,
    monthsCovered: 0,
    targetMonths: 6,
    targetAmount: 0,
    missingAmount: 0,
    monthlyContributionNeeded: 0,
    emergencyAccounts: []
  }

  const isOnTrack = d.monthsCovered >= d.targetMonths

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#121418] border border-white/5 rounded-[28px] p-10 flex items-center justify-center relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#10B981]/5 rounded-full blur-[80px] pointer-events-none" />
          <ProgressRing monthsCovered={d.monthsCovered} targetMonths={d.targetMonths} />
        </div>

        <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8 space-y-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Gasto mensual promedio</p>
            <p className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white">{formatCurrency(d.monthlyExpenseAvg)}</p>
          </div>

          <div className="h-px bg-white/5" />

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Saldo del fondo</p>
            <p className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[#10B981]">{formatCurrency(d.emergencyFundBalance)}</p>
          </div>

          <div className="h-px bg-white/5" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Meta ({d.targetMonths} meses)</p>
              <p className="text-base font-bold text-amber-400">{formatCurrency(d.targetAmount)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Falta para la meta</p>
              <p className={cn('text-base font-bold', d.missingAmount === 0 ? 'text-[#10B981]' : 'text-rose-400')}>
                {d.missingAmount === 0 ? '¡Meta alcanzada!' : formatCurrency(d.missingAmount)}
              </p>
            </div>
          </div>

          {d.monthlyContributionNeeded > 0 && (
            <>
              <div className="h-px bg-white/5" />
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-1">Ahorro mensual recomendado</p>
                <p className="text-xl font-bold text-amber-400">{formatCurrency(d.monthlyContributionNeeded)}</p>
                <p className="text-xs text-gray-500 mt-1">Para completar el fondo en 12 meses</p>
              </div>
            </>
          )}

          {isOnTrack && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
              <Shield size={20} className="text-[#10B981]" />
              <div>
                <p className="text-sm font-bold text-[#10B981]">Fondo completo</p>
                <p className="text-xs text-gray-400">Tu fondo de emergencia está en el nivel recomendado</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">Cuentas del fondo</p>
        {d.emergencyAccounts.length === 0 ? (
          <div className="text-center py-8">
            <Wallet size={28} className="text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-2">Sin cuentas designadas como fondo de emergencia</p>
            <p className="text-xs text-gray-600">
              Ve a Cuentas y marca las cuentas que conforman tu fondo de emergencia con la opción "Fondo de emergencia".
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {d.emergencyAccounts.map((account: any) => (
              <div key={account.id} className="flex justify-between items-center py-3 border-b border-white/5 last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${account.color}20` }}>
                    <Wallet size={14} style={{ color: account.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{account.name}</p>
                    <p className="text-[10px] text-gray-500">{account.type}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-[#10B981]">{formatCurrency(account.currentBalance ?? 0)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function LaboratorioPage(): JSX.Element {
  const [tab, setTab] = useState<TabName>('simulador')

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#08090B]">
      <div className="px-12 py-8 shrink-0 border-b border-white/5 bg-[#08090B]/80 backdrop-blur-md sticky top-0 z-10">
        <PageHeader subtitle="LABORATORIO // ANÁLISIS" title="Laboratorio Financiero" />
        <div className="mt-6">
          <TabBar active={tab} onChange={setTab} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1400px] mx-auto p-12">
          {tab === 'simulador' && <SimulatorTab />}
          {tab === 'deuda' && <DebtTab />}
          {tab === 'emergencia' && <EmergencyTab />}
        </div>
      </div>
    </div>
  )
}
