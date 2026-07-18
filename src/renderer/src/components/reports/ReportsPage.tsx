import { useState, useEffect, useCallback, useRef } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area, CartesianGrid
} from 'recharts'
import {
  BarChart3, Receipt, Building2, Calendar, Printer
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import type { AnalyticsData } from '../../../../shared/types'

// ── Types ─────────────────────────────────────────────────────────────────────
type TabId = 'summary' | 'categories' | 'comparison' | 'export'
type ExportType = 'monthly' | 'annual' | 'categories' | 'debts'

interface TabDef {
  id: TabId
  label: string
}

interface ExportCardDef {
  id: ExportType
  label: string
  description: string
  icon: React.ReactNode
}

const TABS: TabDef[] = [
  { id: 'summary', label: 'Resumen' },
  { id: 'categories', label: 'Categorías' },
  { id: 'comparison', label: 'Comparativa' },
  { id: 'export', label: 'Exportar' }
]

const EXPORT_CARDS: ExportCardDef[] = [
  { id: 'monthly', label: 'Reporte Mensual', description: 'Ingresos, gastos y balance del mes', icon: <Calendar size={20} /> },
  { id: 'annual', label: 'Reporte Anual', description: 'Evolución mes a mes del año', icon: <BarChart3 size={20} /> },
  { id: 'categories', label: 'Gastos por Categoría', description: 'Distribución de gastos por categoría', icon: <Receipt size={20} /> },
  { id: 'debts', label: 'Créditos y Deudas', description: 'Resumen de créditos y tarjetas', icon: <Building2 size={20} /> }
]

const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
]

const now = new Date()

// ── Shared sub-components ─────────────────────────────────────────────────────
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

function Spinner(): JSX.Element {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin" />
    </div>
  )
}

// ── Tab 1: Resumen ────────────────────────────────────────────────────────────
function SummaryTab({ data, loading }: { data: AnalyticsData | null; loading: boolean }): JSX.Element {
  if (loading) return <Spinner />
  if (!data) return <div className="text-gray-500 text-sm text-center py-12">Sin datos para el período</div>

  const balanceIsPositive = data.totalBalance >= 0

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          {
            label: 'INGRESOS',
            value: data.totalIncome,
            delta: data.vsLastPeriod.incomeChange,
            color: '#10B981'
          },
          {
            label: 'GASTOS',
            value: data.totalExpense,
            delta: data.vsLastPeriod.expenseChange,
            color: '#F43F5E'
          },
          {
            label: 'BALANCE',
            value: data.totalBalance,
            delta: 0,
            color: balanceIsPositive ? '#10B981' : '#F43F5E'
          }
        ].map((item) => (
          <div
            key={item.label}
            className="bg-[#121418] border border-white/5 rounded-[28px] p-10 space-y-2"
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

      {/* BarChart: Ingresos vs Gastos */}
      <div className="bg-[#121418] border border-white/5 rounded-[28px] p-10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-8">
          INGRESOS VS GASTOS — ÚLTIMOS 6 MESES
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.monthlyComparison} barGap={4} barSize={22}>
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
    </div>
  )
}

// ── Tab 2: Categorías ─────────────────────────────────────────────────────────
function CategoriesTab({ data, loading }: { data: AnalyticsData | null; loading: boolean }): JSX.Element {
  if (loading) return <Spinner />
  if (!data || data.expensesByCategory.length === 0) {
    return <div className="text-gray-500 text-sm text-center py-12">Sin datos de categorías</div>
  }

  const total = data.totalExpense

  return (
    <div className="bg-[#121418] border border-white/5 rounded-[28px] p-10">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-8">
        GASTOS POR CATEGORÍA
      </p>
      <div className="flex flex-col lg:flex-row gap-8 items-center">
        {/* Donut */}
        <div className="shrink-0 relative">
          <ResponsiveContainer width={260} height={260}>
            <PieChart>
              <Pie
                data={data.expensesByCategory}
                dataKey="amount"
                nameKey="categoryName"
                cx="50%"
                cy="50%"
                outerRadius={110}
                innerRadius="60%"
                strokeWidth={0}
              >
                {data.expensesByCategory.map((entry, i) => (
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
          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-lg font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">
                {formatCurrency(total)}
              </p>
              <p className="text-[10px] text-gray-500 uppercase">Total gastos</p>
            </div>
          </div>
        </div>
        {/* Table */}
        <div className="flex-1 w-full space-y-3">
          {data.expensesByCategory.map((cat) => (
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
  )
}

// ── Tab 3: Comparativa ────────────────────────────────────────────────────────
function ComparisonTab({ data, loading }: { data: AnalyticsData | null; loading: boolean }): JSX.Element {
  if (loading) return <Spinner />
  if (!data || data.monthlyComparison.length === 0) {
    return <div className="text-gray-500 text-sm text-center py-12">Sin datos comparativos</div>
  }

  return (
    <div className="bg-[#121418] border border-white/5 rounded-[28px] p-10">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-8">
        FLUJO DE CAJA MENSUAL
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data.monthlyComparison}>
          <defs>
            <linearGradient id="rptBalanceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
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
            fill="url(#rptBalanceGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Tab 4: Exportar ───────────────────────────────────────────────────────────
async function handleExportCSV(reportType: ExportType, year: number, month: number): Promise<void> {
  let rows: string[][] = []
  const period = `${year}-${String(month).padStart(2, '0')}`

  if (reportType === 'monthly' || reportType === 'categories') {
    const [summaryRes, catsRes] = await Promise.all([
      window.api.transactions.getMonthSummary(year, month),
      window.api.transactions.getExpensesByCategory(
        startOfMonth(new Date(year, month - 1)),
        endOfMonth(new Date(year, month - 1))
      )
    ])
    const totalCat = (catsRes.data ?? []).reduce((s: number, c: any) => s + c.amount, 0)
    rows = [
      ['Tipo', 'Categoría', 'Monto'],
      ['Ingreso Total', '', String(summaryRes.data?.income ?? 0)],
      ['Gasto Total', '', String(summaryRes.data?.expense ?? 0)],
      ['Balance', '', String(summaryRes.data?.balance ?? 0)],
      [],
      ['Categoría', 'Monto', '% del total'],
      ...(catsRes.data ?? []).map((c: any) => [
        c.categoryName,
        String(c.amount),
        totalCat > 0 ? ((c.amount / totalCat) * 100).toFixed(1) + '%' : '0%'
      ])
    ]
  } else if (reportType === 'annual') {
    const results = await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        window.api.transactions.getMonthSummary(year, i + 1).then((r) => [
          format(new Date(year, i), 'MMMM', { locale: es }),
          String(r.data?.income ?? 0),
          String(r.data?.expense ?? 0),
          String(r.data?.balance ?? 0)
        ])
      )
    )
    rows = [['Mes', 'Ingresos', 'Gastos', 'Balance'], ...results]
  } else if (reportType === 'debts') {
    const [cRes, tcRes] = await Promise.all([
      window.api.credits.getAll(),
      window.api.creditCards.getAll()
    ])
    rows = [
      ['Tipo', 'Nombre', 'Saldo Pendiente', 'Cuota Mensual'],
      ...(cRes.data ?? []).map((c: any) => ['Crédito', c.entityName, String(c.pendingAmount), String(c.monthlyPayment)]),
      ...(tcRes.data ?? []).map((c: any) => ['Tarjeta', `${c.name} (${c.bank})`, '', String(c.totalLimit)])
    ]
  }

  const csvContent = rows.map((r) => r.join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `reporte-${reportType}-${period}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function ExportTab({ year, month }: { year: number; month: number }): JSX.Element {
  const [selectedExport, setSelectedExport] = useState<ExportType | null>(null)
  const [exporting, setExporting] = useState(false)
  const [credits, setCredits] = useState<any[]>([])
  const [cards, setCards] = useState<any[]>([])
  const [debtsLoaded, setDebtsLoaded] = useState(false)
  const [loadingDebts, setLoadingDebts] = useState(false)

  const loadDebts = useCallback(async () => {
    if (debtsLoaded) return
    setLoadingDebts(true)
    const [c, tc] = await Promise.all([
      window.api.credits.getAll(),
      window.api.creditCards.getAll()
    ])
    if (c.success && c.data) setCredits(c.data)
    if (tc.success && tc.data) setCards(tc.data)
    setDebtsLoaded(true)
    setLoadingDebts(false)
  }, [debtsLoaded])

  useEffect(() => {
    if (selectedExport === 'debts') loadDebts()
  }, [selectedExport, loadDebts])

  const handleExport = async (type: ExportType): Promise<void> => {
    setExporting(true)
    setSelectedExport(type)
    await handleExportCSV(type, year, month)
    setExporting(false)
  }

  const totalCredit = credits.reduce((s: number, c: any) => s + c.pendingAmount, 0)

  return (
    <div className="space-y-8">
      {/* Export cards */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">
          SELECCIONAR TIPO DE REPORTE
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {EXPORT_CARDS.map((card) => (
            <button
              key={card.id}
              onClick={() => handleExport(card.id)}
              disabled={exporting}
              className="bg-[#121418] border border-white/5 rounded-[24px] p-6 text-left transition-all duration-200 hover:border-white/20 hover:bg-white/[0.02] group"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-white/5 text-gray-500 group-hover:bg-[#10B981]/20 group-hover:text-[#10B981] transition-colors">
                {card.icon}
              </div>
              <p className="text-sm font-bold text-white">{card.label}</p>
              <p className="text-xs text-gray-500 mt-1">{card.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Print button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-6 py-3 bg-[#10B981] text-black font-bold text-sm rounded-2xl hover:bg-[#0ea371] transition-colors shadow-lg shadow-[#10B981]/20"
        >
          <Printer size={16} />
          Imprimir / PDF
        </button>
        {exporting && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-4 h-4 border-2 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin" />
            Exportando...
          </div>
        )}
      </div>

      {/* Inline debts preview when selected */}
      {selectedExport === 'debts' && (
        <div className="bg-[#121418] border border-white/5 rounded-[28px] p-10">
          <h3 className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white mb-6">
            Créditos y Deudas
          </h3>
          {loadingDebts ? (
            <Spinner />
          ) : (
            <>
              {credits.length > 0 && (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
                    Créditos activos
                  </p>
                  <div className="space-y-2 mb-6">
                    {credits.map((c: any) => (
                      <div key={c.id} className="flex justify-between text-sm py-2 border-b border-white/5">
                        <span className="text-gray-300">{c.entityName}</span>
                        <div className="text-right">
                          <span className="text-rose-400 font-bold font-['JetBrains_Mono',monospace]">
                            {formatCurrency(c.pendingAmount)}
                          </span>
                          <span className="text-gray-500 ml-2">
                            ({c.paidInstallments}/{c.totalInstallments} cuotas)
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm pt-2 font-bold">
                      <span className="text-white">Total créditos</span>
                      <span className="text-rose-400 font-['JetBrains_Mono',monospace]">
                        {formatCurrency(totalCredit)}
                      </span>
                    </div>
                  </div>
                </>
              )}
              {cards.length > 0 && (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
                    Tarjetas de crédito
                  </p>
                  <div className="space-y-2">
                    {cards.map((card: any) => (
                      <div key={card.id} className="flex justify-between text-sm py-2 border-b border-white/5">
                        <span className="text-gray-300">{card.name} ({card.bank})</span>
                        <span className="text-gray-400 font-['JetBrains_Mono',monospace]">
                          Cupo: {formatCurrency(card.totalLimit)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {credits.length === 0 && cards.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No hay créditos ni tarjetas registrados</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function ReportsPage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabId>('summary')
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'annual'>('monthly')
  const [selYear, setSelYear] = useState(now.getFullYear())
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const loadedKey = useRef('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const key = `${selYear}-${selMonth}-${period}`
      if (loadedKey.current !== key) {
        loadedKey.current = key
      }
      const res = await window.api.analytics.getData(selYear, selMonth, period)
      if (res.success && res.data) setData(res.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [selYear, selMonth, period])

  useEffect(() => { load() }, [load])

  const years = [now.getFullYear() - 1, now.getFullYear()]

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Sticky header */}
      <div className="px-12 py-8 shrink-0 border-b border-white/5 bg-[#08090B]/80 backdrop-blur-md sticky top-0 z-10">
        <PageHeader
          subtitle="REPORTES // ANÁLISIS FINANCIERO"
          title="Reportes"
          actions={
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
                  <Select value={String(selMonth)} onValueChange={(v) => setSelMonth(Number(v))}>
                    <SelectTrigger className="w-auto h-auto bg-[#0F1115] px-3 py-2 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m, i) => (
                        <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={String(selYear)} onValueChange={(v) => setSelYear(Number(v))}>
                    <SelectTrigger className="w-auto h-auto bg-[#0F1115] px-3 py-2 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-[1400px] mx-auto p-12 space-y-10">

          {/* Tab bar */}
          <div className="flex bg-[#0F1115] border border-white/5 rounded-2xl p-1 w-fit">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#10B981] text-black'
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'summary' && (
            <SummaryTab data={data} loading={loading} />
          )}
          {activeTab === 'categories' && (
            <CategoriesTab data={data} loading={loading} />
          )}
          {activeTab === 'comparison' && (
            <ComparisonTab data={data} loading={loading} />
          )}
          {activeTab === 'export' && (
            <ExportTab year={selYear} month={selMonth} />
          )}
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .px-12 { padding: 20px !important; }
          button, nav, aside { display: none !important; }
        }
      `}</style>
    </div>
  )
}
