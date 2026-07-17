import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { useCountUp } from '@/hooks/useCountUp'
import type { HealthScoreData } from '../../../../shared/types'

// ── Score helpers ──────────────────────────────────────────────────────────────
function getScoreColor(score: number): string {
  if (score >= 70) return '#10B981'
  if (score >= 40) return '#F59E0B'
  return '#F43F5E'
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excelente'
  if (score >= 60) return 'Bueno'
  if (score >= 40) return 'Regular'
  return 'Crítico'
}

// ── Gauge SVG semi-circular ────────────────────────────────────────────────────
function HealthGauge({ score }: { score: number }): JSX.Element {
  const animated = useCountUp({ end: score, duration: 2000, delay: 200 })
  const r = 90
  const cx = 130
  const cy = 120
  // Semi-circle: de 180° a 0° (de izquierda a derecha por la parte superior)
  const circumference = Math.PI * r // semi-circle
  const dashOffset = circumference - (animated / 100) * circumference
  const color = getScoreColor(animated)

  return (
    <div className="group relative cursor-help">
      <svg width="260" height="150" viewBox="0 0 260 150">
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="16"
          strokeLinecap="round"
        />
        {/* Fill animado */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={`${dashOffset}`}
          style={{
            transition: 'stroke-dashoffset 0.1s linear, stroke 0.5s ease',
            filter: `drop-shadow(0 0 8px ${color}80)`
          }}
        />
        {/* Score central */}
        <text
          x={cx}
          y={cy - 18}
          textAnchor="middle"
          fill="white"
          fontSize="42"
          fontWeight="800"
          fontFamily="'Plus Jakarta Sans', sans-serif"
        >
          {Math.round(animated)}
        </text>
        <text x={cx + 30} y={cy - 22} textAnchor="middle" fill="#6B7280" fontSize="14">
          / 100
        </text>
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          fill={color}
          fontSize="13"
          fontWeight="700"
          fontFamily="'Plus Jakarta Sans', sans-serif"
        >
          {getScoreLabel(animated)}
        </text>
      </svg>
      {/* Tooltip interactivo flotante */}
      <div className="absolute left-1/2 top-10 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 border border-white/20 px-4 py-3 rounded-xl shadow-2xl pointer-events-none z-10 w-56 text-center">
        <p className="text-[10px] font-bold text-white mb-1">Índice Global: {Math.round(animated)}/100</p>
        <p className="text-[10px] text-gray-400">Puntaje calculado en base a liquidez, ahorro, deudas, presupuesto y tendencias de los últimos 3 meses.</p>
      </div>
    </div>
  )
}

// ── Factor bar ─────────────────────────────────────────────────────────────────
function FactorCard({
  label,
  score,
  weight,
  description,
  status
}: {
  label: string
  score: number
  weight: number
  description: string
  status: 'good' | 'warning' | 'danger'
}): JSX.Element {
  const color = status === 'good' ? '#10B981' : status === 'warning' ? '#F59E0B' : '#F43F5E'
  return (
    <div className="group relative bg-[#0F1115] border border-white/5 rounded-2xl p-5 space-y-3 hover:border-white/20 transition-all cursor-help">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</p>
          <p className="text-[10px] text-gray-600 mt-0.5">Peso en el score global: {weight}%</p>
        </div>
        <span className="text-xl font-bold font-['Plus_Jakarta_Sans',sans-serif]" style={{ color }}>
          {score}
          <span className="text-xs text-gray-600 font-normal ml-1">/ 100</span>
        </span>
      </div>
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: color, boxShadow: `0 0 8px ${color}60` }}
        />
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
      
      {/* Tooltip interactivo flotante */}
      <div className="absolute left-1/2 -top-12 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 border border-white/20 px-3 py-2 rounded-xl shadow-2xl pointer-events-none z-10 w-48 text-center">
        <p className="text-[10px] font-bold text-white mb-1">Score: {score}/100</p>
        <p className="text-[9px] text-gray-400">Este factor equivale al {weight}% de tu calificación de salud financiera.</p>
      </div>
    </div>
  )
}

// ── Custom Tooltip para el historial ──────────────────────────────────────────
function HistoryTooltip({ active, payload, label }: any): JSX.Element | null {
  if (!active || !payload?.length) return null
  const score = payload[0]?.value as number
  return (
    <div className="bg-black/80 border border-white/10 rounded-2xl p-3 text-xs">
      <p className="text-gray-400">{label}</p>
      <p className="font-bold mt-1" style={{ color: getScoreColor(score) }}>
        Score: {score}
      </p>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export function HealthPage(): JSX.Element {
  const [data, setData] = useState<HealthScoreData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [scoreRes] = await Promise.all([
        window.api.health.getScore(),
        window.api.health.saveSnapshot()
      ])
      if (scoreRes.success && scoreRes.data) setData(scoreRes.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const historyData = (data?.history ?? []).map((h) => ({
    month: new Date(h.snapshotDate).toLocaleDateString('es-CO', { month: 'short' }),
    score: Math.round(h.score)
  }))

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-[1400px] mx-auto p-12 space-y-10">

        {/* Header */}
        <div>
          <p className="text-[10px] font-bold text-[#10B981] uppercase tracking-[0.4em]">
            FASE 3 // ANÁLISIS AVANZADO
          </p>
          <h1 className="text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold tracking-tight text-white mt-1">
            Salud Financiera
          </h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600 text-sm">Calculando score...</div>
          </div>
        ) : (
          <>
            {/* Hero card — Gauge */}
            <div className="bg-[#121418] border border-white/5 rounded-[28px] p-10">
              <div className="flex flex-col lg:flex-row items-center gap-12">
                {/* Gauge */}
                <div className="flex flex-col items-center gap-4 shrink-0">
                  <HealthGauge score={data?.score ?? 0} />
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Índice de Salud Financiera
                    </p>
                  </div>
                </div>

                {/* Recomendaciones */}
                <div className="flex-1 space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    TOP ACCIONES RECOMENDADAS
                  </p>
                  {(data?.recommendations ?? []).length === 0 ? (
                    <p className="text-sm text-gray-600">Tu salud financiera es óptima — sin acciones urgentes.</p>
                  ) : (
                    (data?.recommendations ?? []).map((rec, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 bg-[#0F1115] border border-white/5 rounded-2xl p-4"
                        style={{ borderLeft: '3px solid #10B981' }}
                      >
                        <span className="text-[#10B981] mt-0.5">⚡</span>
                        <p className="text-sm text-gray-300 leading-relaxed">{rec}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Grid de 8 factores */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-6">
                DESGLOSE POR FACTOR
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {(data?.factorDetails ?? []).map((f) => (
                  <FactorCard
                    key={f.key}
                    label={f.label}
                    score={f.score}
                    weight={f.weight}
                    description={f.description}
                    status={f.status}
                  />
                ))}
              </div>
            </div>

            {/* Historial */}
            {historyData.length > 1 && (
              <div className="bg-[#121418] border border-white/5 rounded-[28px] p-10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-6">
                  HISTORIAL DE SCORE (ÚLTIMOS 6 MESES)
                </p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={historyData} barSize={32}>
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#4B5563', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip content={<HistoryTooltip />} cursor={false} />
                    <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                      {historyData.map((entry, i) => (
                        <Cell key={i} fill={getScoreColor(entry.score)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
