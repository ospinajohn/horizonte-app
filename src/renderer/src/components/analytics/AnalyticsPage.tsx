import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area, CartesianGrid
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { AnalyticsData } from '../../../../shared/types'

const now = new Date()

// ── Custom Tooltips ────────────────────────────────────────────────────────────
function DarkTooltip({ active, payload, label, currency = true }: any): JSX.Element | null {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-black/80 border border-white/10 rounded-2xl p-3 text-xs min-w-[140px]">
      <p className="text-gray-400 mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-bold">
          {p.name}: {currency ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

// ── Insight icon ──────────────────────────────────────────────────────────────
function InsightIcon({ type }: { type: 'positive' | 'warning' | 'info' }): JSX.Element {
  if (type === 'positive') return <span className="text-[#10B981]">✅</span>
  if (type === 'warning') return <span className="text-amber-500">⚠️</span>
  return <span className="text-blue-400">ℹ️</span>
}

function insightBorder(type: 'positive' | 'warning' | 'info'): string {
  if (type === 'positive') return '#10B981'
  if (type === 'warning') return '#F59E0B'
  return '#60A5FA'
}

// ── Delta badge ───────────────────────────────────────────────────────────────
function Delta({ value }: { value: number }): JSX.Element {
  const color = value > 0 ? '#10B981' : value < 0 ? '#F43F5E' : '#6B7280'
  const sign = value > 0 ? '+' : ''
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
      style={{ color, borderColor: `${color}40`, background: `${color}15` }}
    >
      {sign}{value}%
    </span>
  )
}

// ── Donut label ───────────────────────────────────────────────────────────────
function DonutCenter({ cx, cy, total }: { cx: number; cy: number; total: number }): JSX.Element {
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#fff" fontSize={18} fontWeight={700}>
        {formatCurrency(total)}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#4B5563" fontSize={10}>
        TOTAL GASTOS
      </text>
    </g>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function AnalyticsPage(): JSX.Element {
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'annual'>('monthly')
  const [selYear, setSelYear] = useState(now.getFullYear())
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.api.analytics.getData(selYear, selMonth, period)
      if (res.success && res.data) setData(res.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [selYear, selMonth, period])

  useEffect(() => { load() }, [load])

  const months = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
  ]
  const years = [now.getFullYear() - 1, now.getFullYear()]

  const balanceIsPositive = (data?.totalBalance ?? 0) >= 0

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-[1400px] mx-auto p-12 space-y-10">

        {/* Header + controles */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-[10px] font-bold text-[#10B981] uppercase tracking-[0.4em]">
              FASE 3 // ANÁLISIS AVANZADO
            </p>
            <h1 className="text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold tracking-tight text-white mt-1">
              Analítica
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Toggle período */}
            <div className="flex bg-[#0F1115] border border-white/5 rounded-2xl p-1">
              {(['monthly', 'quarterly', 'annual'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    period === p ? 'bg-[#10B981] text-black' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  {p === 'monthly' ? 'Mensual' : p === 'quarterly' ? 'Trimestral' : 'Anual'}
                </button>
              ))}
            </div>
            {period === 'monthly' && (
              <>
                <select
                  value={selMonth}
                  onChange={(e) => setSelMonth(Number(e.target.value))}
                  className="bg-[#0F1115] border border-white/10 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {months.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select
                  value={selYear}
                  onChange={(e) => setSelYear(Number(e.target.value))}
                  className="bg-[#0F1115] border border-white/10 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600 text-sm">Cargando datos...</div>
          </div>
        ) : (
          <>
            {/* Sección 1 — Resumen del período */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  label: 'INGRESOS',
                  value: data?.totalIncome ?? 0,
                  delta: data?.vsLastPeriod.incomeChange ?? 0,
                  color: '#10B981'
                },
                {
                  label: 'GASTOS',
                  value: data?.totalExpense ?? 0,
                  delta: data?.vsLastPeriod.expenseChange ?? 0,
                  color: '#F43F5E'
                },
                {
                  label: 'BALANCE',
                  value: data?.totalBalance ?? 0,
                  delta: 0,
                  color: balanceIsPositive ? '#10B981' : '#F43F5E'
                }
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-[#121418] border border-white/5 rounded-[28px] p-8 space-y-2"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    {item.label}
                  </p>
                  <p
                    className="text-3xl font-['Plus_Jakarta_Sans',sans-serif] font-bold"
                    style={{ color: item.color }}
                  >
                    {formatCurrency(item.value)}
                  </p>
                  {item.delta !== 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <Delta value={item.delta} />
                      <span className="text-[10px] text-gray-600">vs período anterior</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Sección 2 — Gastos por categoría */}
            {(data?.expensesByCategory ?? []).length > 0 && (
              <div className="bg-[#121418] border border-white/5 rounded-[28px] p-10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-8">
                  GASTOS POR CATEGORÍA
                </p>
                <div className="flex flex-col lg:flex-row gap-8 items-center">
                  {/* Donut */}
                  <div className="shrink-0">
                    <ResponsiveContainer width={240} height={240}>
                      <PieChart>
                        <Pie
                          data={data?.expensesByCategory ?? []}
                          dataKey="amount"
                          nameKey="categoryName"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          innerRadius="60%"
                          strokeWidth={0}
                        >
                          {(data?.expensesByCategory ?? []).map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            const d = payload[0].payload
                            return (
                              <div className="bg-black/80 border border-white/10 rounded-2xl p-3 text-xs">
                                <p className="text-white font-bold">{d.categoryName}</p>
                                <p className="text-gray-400">{formatCurrency(d.amount)}</p>
                                <p className="text-gray-400">{d.percentage}%</p>
                              </div>
                            )
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Tabla */}
                  <div className="flex-1 space-y-3">
                    {(data?.expensesByCategory ?? []).slice(0, 8).map((cat) => (
                      <div key={cat.categoryId} className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ background: cat.color }}
                        />
                        <span className="text-sm text-gray-400 flex-1">{cat.categoryName}</span>
                        <span className="text-sm font-bold text-white font-['JetBrains_Mono',monospace]">
                          {formatCurrency(cat.amount)}
                        </span>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ color: cat.color, background: `${cat.color}20` }}
                        >
                          {cat.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Sección 3 — Ingresos vs Gastos */}
            <div className="bg-[#121418] border border-white/5 rounded-[28px] p-10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-8">
                INGRESOS VS GASTOS — ÚLTIMOS 6 MESES
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.monthlyComparison ?? []} barGap={4} barSize={22}>
                  <CartesianGrid strokeDasharray="1 8" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#4B5563', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#4B5563', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar dataKey="income" name="Ingresos" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Gastos" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Sección 4 — Flujo de caja (Area chart) */}
            <div className="bg-[#121418] border border-white/5 rounded-[28px] p-10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-8">
                FLUJO DE CAJA MENSUAL
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data?.monthlyComparison ?? []}>
                  <defs>
                    <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="balanceNegGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="1 8" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#4B5563', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#4B5563', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      const balance = payload[0]?.value as number
                      return (
                        <div className="bg-black/80 border border-white/10 rounded-2xl p-3 text-xs">
                          <p className="text-gray-400 mb-1">{label}</p>
                          <p className="font-bold" style={{ color: balance >= 0 ? '#10B981' : '#F43F5E' }}>
                            Balance: {formatCurrency(balance)}
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    name="Balance"
                    stroke="#10B981"
                    strokeWidth={2}
                    fill="url(#balanceGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Sección 5 — Insights */}
            {(data?.insights ?? []).length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">
                  INSIGHTS AUTOMÁTICOS
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {(data?.insights ?? []).map((insight, i) => (
                    <div
                      key={i}
                      className="bg-[#121418] border border-white/5 rounded-2xl p-4 flex items-start gap-3"
                      style={{ borderLeft: `3px solid ${insightBorder(insight.type)}` }}
                    >
                      <InsightIcon type={insight.type} />
                      <p className="text-sm text-gray-300 leading-relaxed">{insight.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
