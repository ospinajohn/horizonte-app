import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { useCountUp } from '@/hooks/useCountUp'
import { PageHeader } from '@/components/ui/PageHeader'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Lightbulb, RefreshCw } from 'lucide-react'
import type { HealthScoreData, RecommendationLog } from '../../../../shared/types'

type PageTab = 'score' | 'recomendaciones'
type RecTab = 'all' | 'pending' | 'applied'

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

// ── Recommendation type helpers ────────────────────────────────────────────────
function recTypeIcon(type: RecommendationLog['type']): string {
  const map: Record<string, string> = {
    SAVINGS: '💰',
    DEBT_OPTIMIZATION: '⚖️',
    TIMING: '⏰',
    INVESTMENT: '📈',
    OTHER: '💡'
  }
  return map[type] ?? '💡'
}

function recTypeColor(type: RecommendationLog['type']): string {
  const map: Record<string, string> = {
    SAVINGS: '#10B981',
    DEBT_OPTIMIZATION: '#60A5FA',
    TIMING: '#F59E0B',
    INVESTMENT: '#A78BFA',
    OTHER: '#6B7280'
  }
  return map[type] ?? '#6B7280'
}

// ── Gauge SVG semi-circular ────────────────────────────────────────────────────
function HealthGauge({ score }: { score: number }): JSX.Element {
  const animated = useCountUp({ end: score, duration: 2000, delay: 200 })
  const r = 90
  const cx = 130
  const cy = 120
  const circumference = Math.PI * r
  const dashOffset = circumference - (animated / 100) * circumference
  const color = getScoreColor(animated)

  return (
    <div className="group relative cursor-help">
      <svg width="260" height="150" viewBox="0 0 260 150">
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="16"
          strokeLinecap="round"
        />
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
      <div className="absolute left-1/2 top-10 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 border border-white/20 px-4 py-3 rounded-xl shadow-2xl pointer-events-none z-10 w-56 text-center">
        <p className="text-[10px] font-bold text-white mb-1">Índice Global: {Math.round(animated)}/100</p>
        <p className="text-[10px] text-gray-400">Puntaje calculado en base a liquidez, ahorro, deudas, presupuesto y tendencias de los últimos 3 meses.</p>
      </div>
    </div>
  )
}

// ── Factor card ────────────────────────────────────────────────────────────────
function FactorCard({
  label, score, weight, description, status
}: {
  label: string; score: number; weight: number; description: string; status: 'good' | 'warning' | 'danger'
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
      <div className="absolute left-1/2 -top-12 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 border border-white/20 px-3 py-2 rounded-xl shadow-2xl pointer-events-none z-10 w-48 text-center">
        <p className="text-[10px] font-bold text-white mb-1">Score: {score}/100</p>
        <p className="text-[9px] text-gray-400">Este factor equivale al {weight}% de tu calificación de salud financiera.</p>
      </div>
    </div>
  )
}

// ── History chart tooltip ──────────────────────────────────────────────────────
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

// ════════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════════

export function HealthPage(): JSX.Element {
  const [pageTab, setPageTab] = useState<PageTab>('score')

  // ── Health state ──
  const [healthData, setHealthData] = useState<HealthScoreData | null>(null)
  const [healthLoading, setHealthLoading] = useState(true)

  // ── Recommendations state ──
  const [recs, setRecs] = useState<RecommendationLog[]>([])
  const [recTab, setRecTab] = useState<RecTab>('all')
  const [recsLoading, setRecsLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const navigate = useNavigate()

  // ── Load health ──
  const loadHealth = useCallback(async () => {
    setHealthLoading(true)
    try {
      const [scoreRes] = await Promise.all([
        window.api.health.getScore(),
        window.api.health.saveSnapshot()
      ])
      if (scoreRes.success && scoreRes.data) setHealthData(scoreRes.data)
    } catch {
      // ignore
    } finally {
      setHealthLoading(false)
    }
  }, [])

  // ── Load recommendations ──
  const loadRecs = useCallback(async () => {
    setRecsLoading(true)
    try {
      const res = await window.api.recommendations.getAll()
      if (res.success && res.data) setRecs(res.data)
    } catch {
      // ignore
    } finally {
      setRecsLoading(false)
    }
  }, [])

  useEffect(() => { loadHealth() }, [loadHealth])
  useEffect(() => { loadRecs() }, [loadRecs])

  // ── Recommendation handlers ──
  const handleGenerate = async (): Promise<void> => {
    setGenerating(true)
    try {
      const res = await window.api.recommendations.generate()
      if (res.success && res.data) setRecs(res.data)
    } catch {
      // ignore
    } finally {
      setGenerating(false)
    }
  }

  const handleMarkApplied = async (id: number): Promise<void> => {
    await window.api.recommendations.markApplied(id)
    setRecs((prev) => prev.map((r) => (r.id === id ? { ...r, isApplied: true, isRead: true } : r)))
  }

  const handleMarkRead = async (id: number): Promise<void> => {
    await window.api.recommendations.markRead(id)
    setRecs((prev) => prev.map((r) => (r.id === id ? { ...r, isRead: true } : r)))
  }

  const filteredRecs = recs.filter((r) => {
    if (recTab === 'pending') return !r.isApplied
    if (recTab === 'applied') return r.isApplied
    return true
  })

  const pendingCount = recs.filter((r) => !r.isApplied).length

  // ── History chart data ──
  const historyData = (healthData?.history ?? []).map((h) => ({
    month: new Date(h.snapshotDate).toLocaleDateString('es-CO', { month: 'short' }),
    score: Math.round(h.score)
  }))

  // ── Tabs config ──
  const pageTabs: { id: PageTab; label: string }[] = [
    { id: 'score', label: 'Score' },
    { id: 'recomendaciones', label: 'Recomendaciones' }
  ]

  const recTabs: { id: RecTab; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'pending', label: 'Pendientes' },
    { id: 'applied', label: 'Aplicadas' }
  ]

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-[1400px] mx-auto p-12 space-y-10">

        {/* Header + tab bar */}
        <div className="space-y-6">
          <PageHeader subtitle="SALUD FINANCIERA" title="Salud Financiera" />

          <div className="flex bg-[#0F1115] border border-white/5 rounded-2xl p-1 w-fit">
            {pageTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setPageTab(t.id)}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  pageTab === t.id ? 'bg-[#10B981] text-black' : 'text-gray-500 hover:text-white'
                }`}
              >
                {t.label}
                {t.id === 'recomendaciones' && pendingCount > 0 && (
                  <span className="ml-1.5 bg-black/20 text-[10px] px-1.5 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            TAB: SCORE
        ═══════════════════════════════════════════════════════════════════════ */}
        {pageTab === 'score' && (
          <>
            {healthLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-600 text-sm">Calculando score...</div>
              </div>
            ) : (
              <>
                {/* Hero card — Gauge + top recommendations */}
                <div className="bg-[#121418] border border-white/5 rounded-[28px] p-10">
                  <div className="flex flex-col lg:flex-row items-center gap-12">
                    <div className="flex flex-col items-center gap-4 shrink-0">
                      <HealthGauge score={healthData?.score ?? 0} />
                      <div className="text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                          Índice de Salud Financiera
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        TOP ACCIONES RECOMENDADAS
                      </p>
                      {(healthData?.recommendations ?? []).length === 0 ? (
                        <p className="text-sm text-gray-600">Tu salud financiera es óptima — sin acciones urgentes.</p>
                      ) : (
                        (healthData?.recommendations ?? []).map((rec, i) => (
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

                {/* 8 factor cards grid */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-6">
                    DESGLOSE POR FACTOR
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {(healthData?.factorDetails ?? []).map((f) => (
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

                {/* History bar chart */}
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
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            TAB: RECOMENDACIONES
        ═══════════════════════════════════════════════════════════════════════ */}
        {pageTab === 'recomendaciones' && (
          <>
            {/* Sub-tabs + generate button */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex bg-[#0F1115] border border-white/5 rounded-2xl p-1 w-fit">
                {recTabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setRecTab(t.id)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      recTab === t.id ? 'bg-[#10B981] text-black' : 'text-gray-500 hover:text-white'
                    }`}
                  >
                    {t.label}
                    {t.id === 'pending' && pendingCount > 0 && (
                      <span className="ml-1.5 bg-white/10 text-xs px-1.5 py-0.5 rounded-full">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-2 bg-[#10B981] text-black font-bold px-5 py-3 rounded-2xl text-sm disabled:opacity-50 transition-all hover:bg-[#3EB489]"
              >
                <RefreshCw size={16} className={generating ? 'animate-spin' : ''} />
                Generar
              </button>
            </div>

            {/* Recommendations list */}
            {recsLoading ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-gray-600 text-sm">Cargando...</p>
              </div>
            ) : filteredRecs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-6 py-20 bg-[#121418] border border-white/5 rounded-[28px]">
                <Lightbulb size={48} className="text-gray-700" />
                <div className="text-center space-y-2">
                  <p className="text-white font-bold text-lg">Sin recomendaciones</p>
                  <p className="text-gray-600 text-sm">
                    {recTab === 'applied'
                      ? 'Aún no has aplicado ninguna recomendación.'
                      : 'Genera recomendaciones basadas en tu estado financiero actual.'}
                  </p>
                </div>
                {recTab !== 'applied' && (
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="bg-[#10B981] text-black font-bold px-6 py-3 rounded-2xl text-sm"
                  >
                    Generar recomendaciones
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRecs.map((rec) => {
                  const color = recTypeColor(rec.type)
                  const icon = recTypeIcon(rec.type)
                  return (
                    <div
                      key={rec.id}
                      className={`bg-[#121418] border border-white/5 rounded-[28px] p-8 space-y-4 transition-all ${
                        rec.isApplied ? 'opacity-50' : ''
                      }`}
                      style={{ borderLeft: `3px solid ${color}` }}
                      onMouseEnter={() => { if (!rec.isRead) handleMarkRead(rec.id) }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <span className="text-2xl shrink-0">{icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="text-base font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">
                                {rec.title}
                              </h3>
                              {!rec.isRead && (
                                <span className="w-2 h-2 bg-[#10B981] rounded-full" />
                              )}
                              {rec.isApplied && (
                                <span
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                                  style={{ color: '#10B981', borderColor: '#10B98140', background: '#10B98115' }}
                                >
                                  APLICADA
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                              {rec.description}
                            </p>
                            {rec.impact && (
                              <p className="text-xs text-gray-600 mt-2 font-['JetBrains_Mono',monospace]">
                                💡 {rec.impact}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-600 shrink-0">
                          {formatDistanceToNow(new Date(rec.createdAt), { addSuffix: true, locale: es })}
                        </span>
                      </div>

                      {!rec.isApplied && (
                        <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-white/5">
                          {rec.actionPath && (
                            <button
                              onClick={() => navigate(rec.actionPath!)}
                              className="text-xs font-bold text-[#10B981] hover:underline flex items-center gap-1"
                            >
                              Ver módulo →
                            </button>
                          )}
                          <button
                            onClick={() => handleMarkApplied(rec.id)}
                            className="text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl transition-all text-gray-400 hover:text-white"
                          >
                            ✓ Marcar como aplicada
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
