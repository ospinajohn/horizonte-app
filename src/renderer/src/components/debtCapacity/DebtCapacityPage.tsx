import { useState, useEffect, useCallback } from 'react'
import { formatCurrency, cn } from '@/lib/utils'
import type { DebtCapacityData } from '../../../../shared/types'

// ── Gauge SVG ─────────────────────────────────────────────────────────────────
function DebtGauge({ percent }: { percent: number }): JSX.Element {
  const clampedPct = Math.min(Math.max(percent, 0), 100)

  // SVG arc: semicircle, r=80, center (100, 100), angle from -180° to 0°
  const r = 80
  const cx = 100
  const cy = 100
  const circumference = Math.PI * r // half circle

  // Zones: 0-30 green, 30-40 yellow, 40-100 red
  const lowAngle = (30 / 100) * Math.PI
  const midAngle = (40 / 100) * Math.PI
  const progressAngle = (clampedPct / 100) * Math.PI

  // Convert angle to SVG arc
  const toPoint = (angle: number): { x: number; y: number } => ({
    x: cx - r * Math.cos(angle),
    y: cy - r * Math.sin(angle)
  })

  const start = toPoint(Math.PI) // left
  const lowEnd = toPoint(Math.PI - lowAngle)
  const midEnd = toPoint(Math.PI - midAngle)
  const arcEnd = toPoint(Math.PI - progressAngle)

  // Pointer needle
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
        {/* Background arc */}
        <path d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${toPoint(0).x} ${toPoint(0).y}`} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" strokeLinecap="round" />
        {/* Green zone: 0-30% */}
        <path d={arcPath(start, lowEnd)} fill="none" stroke="#10B981" strokeWidth="10" strokeLinecap="round" opacity="0.3" />
        {/* Amber zone: 30-40% */}
        <path d={arcPath(lowEnd, midEnd)} fill="none" stroke="#F59E0B" strokeWidth="10" strokeLinecap="round" opacity="0.3" />
        {/* Red zone: 40-100% */}
        <path d={arcPath(midEnd, toPoint(0))} fill="none" stroke="#F43F5E" strokeWidth="10" strokeLinecap="round" opacity="0.3" />
        {/* Progress arc */}
        <path
          d={arcPath(start, arcEnd)}
          fill="none"
          stroke={gaugeColor}
          strokeWidth="10"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${gaugeColor})` }}
        />
        {/* Needle */}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        <circle cx={cx} cy={cy} r={4} fill="white" opacity="0.8" />
        {/* Center text */}
        <text x={cx} y={cy - 12} textAnchor="middle" fill="white" fontSize="22" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="bold">
          {clampedPct.toFixed(1)}%
        </text>
      </svg>
      <div
        className="text-sm font-bold px-4 py-1.5 rounded-full border mt-1"
        style={{
          color: gaugeColor,
          borderColor: `${gaugeColor}30`,
          backgroundColor: `${gaugeColor}10`
        }}
      >
        {label}
      </div>
    </div>
  )
}

// ── Interactive calculator ────────────────────────────────────────────────────
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
    <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8 mt-8">
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

// ── Main Page ──────────────────────────────────────────────────────────────────
export function DebtCapacityPage(): JSX.Element {
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
      <div className="flex-1 flex items-center justify-center h-full">
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
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-12 py-8 shrink-0 border-b border-white/5 bg-[#08090B]/80 backdrop-blur-md sticky top-0 z-10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#10B981] mb-2">// Análisis</p>
        <h1 className="text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-white tracking-tight">
          Capacidad de Endeudamiento
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-12 py-8 custom-scrollbar">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gauge hero */}
          <div className="bg-[#121418] border border-white/5 rounded-[28px] p-10 flex flex-col items-center justify-center">
            <DebtGauge percent={d.debtRatioPercent} />
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-6 mb-1 text-center">% comprometido de tus ingresos</p>
          </div>

          {/* Breakdown */}
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
    </div>
  )
}
