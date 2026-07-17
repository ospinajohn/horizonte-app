import { useState, useRef, useCallback } from 'react'
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { es } from 'date-fns/locale'
import { FileText, Printer, Download, BarChart3, Receipt, Building2, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

// ── Report types ──────────────────────────────────────────────────────────────
type ReportType = 'monthly' | 'annual' | 'categories' | 'debts'

interface ReportConfig {
  id: ReportType
  label: string
  description: string
  icon: React.ReactNode
}

const REPORTS: ReportConfig[] = [
  { id: 'monthly', label: 'Reporte Mensual', description: 'Ingresos, gastos y balance del mes', icon: <Calendar size={22} /> },
  { id: 'annual', label: 'Reporte Anual', description: 'Evolución mes a mes del año', icon: <BarChart3 size={22} /> },
  { id: 'categories', label: 'Gastos por Categoría', description: 'Distribución de gastos por categoría', icon: <Receipt size={22} /> },
  { id: 'debts', label: 'Créditos y Deudas', description: 'Resumen de créditos y tarjetas', icon: <Building2 size={22} /> }
]

// ── Monthly Report ─────────────────────────────────────────────────────────────
function MonthlyReport({ year, month }: { year: number; month: number }): JSX.Element {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const loaded = useRef(false)

  const load = useCallback(async (): Promise<void> => {
    if (loaded.current) return
    loaded.current = true
    setLoading(true)

    const [summary, categories] = await Promise.all([
      window.api.transactions.getMonthSummary(year, month),
      window.api.transactions.getExpensesByCategory(
        startOfMonth(new Date(year, month - 1)),
        endOfMonth(new Date(year, month - 1))
      )
    ])

    setData({
      summary: summary.data,
      categories: categories.data ?? []
    })
    setLoading(false)
  }, [year, month])

  // Load on mount
  useState(() => { load() })

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin" /></div>
  }

  if (!data) return <div className="text-gray-500 text-sm text-center py-8">Sin datos para el período seleccionado</div>

  const { summary, categories } = data
  const top5 = [...(categories ?? [])].sort((a: any, b: any) => b.amount - a.amount).slice(0, 5)

  return (
    <div id="report-content" className="bg-[#121418] border border-white/5 rounded-[28px] p-8">
      <div className="mb-6">
        <h3 className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white">
          Reporte Mensual — {format(new Date(year, month - 1), 'MMMM yyyy', { locale: es })}
        </h3>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Ingresos</p>
          <p className="text-xl font-bold text-[#10B981]">{formatCurrency(summary?.income ?? 0)}</p>
        </div>
        <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Gastos</p>
          <p className="text-xl font-bold text-rose-400">{formatCurrency(summary?.expense ?? 0)}</p>
        </div>
        <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Balance</p>
          <p className={`text-xl font-bold ${(summary?.balance ?? 0) >= 0 ? 'text-[#10B981]' : 'text-rose-400'}`}>
            {formatCurrency(summary?.balance ?? 0)}
          </p>
        </div>
      </div>

      {/* Top 5 categories */}
      {top5.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Top 5 categorías de gasto</p>
          <div className="space-y-2">
            {top5.map((cat: any, i: number) => (
              <div key={cat.categoryId} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-4">{i + 1}</span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm text-gray-300">{cat.categoryName}</span>
                </div>
                <span className="text-sm font-bold text-white">{formatCurrency(cat.amount)}</span>
                <div className="w-24">
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min((cat.amount / (top5[0]?.amount ?? 1)) * 100, 100)}%`,
                        backgroundColor: cat.color
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Annual Report ──────────────────────────────────────────────────────────────
function AnnualReport({ year }: { year: number }): JSX.Element {
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const loaded = useRef(false)

  const load = useCallback(async (): Promise<void> => {
    if (loaded.current) return
    loaded.current = true
    setLoading(true)

    const results = await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        window.api.transactions.getMonthSummary(year, i + 1).then((r) => ({
          month: i + 1,
          label: format(new Date(year, i), 'MMM', { locale: es }),
          ...(r.data ?? { income: 0, expense: 0, balance: 0 })
        }))
      )
    )
    setMonthlyData(results)
    setLoading(false)
  }, [year])

  useState(() => { load() })

  if (loading) return <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin" /></div>

  const totalIncome = monthlyData.reduce((s, m) => s + (m.income ?? 0), 0)
  const totalExpense = monthlyData.reduce((s, m) => s + (m.expense ?? 0), 0)

  return (
    <div id="report-content" className="bg-[#121418] border border-white/5 rounded-[28px] p-8">
      <h3 className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white mb-6">
        Reporte Anual {year}
      </h3>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Total ingresos {year}</p>
          <p className="text-xl font-bold text-[#10B981]">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Total gastos {year}</p>
          <p className="text-xl font-bold text-rose-400">{formatCurrency(totalExpense)}</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="grid grid-cols-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 pb-2 border-b border-white/5">
          <span>Mes</span><span>Ingresos</span><span>Gastos</span><span>Balance</span>
        </div>
        {monthlyData.map((m) => (
          <div key={m.month} className="grid grid-cols-4 text-sm py-1.5 border-b border-white/3">
            <span className="text-gray-400 capitalize">{m.label}</span>
            <span className="text-[#10B981]">{formatCurrency(m.income ?? 0)}</span>
            <span className="text-rose-400">{formatCurrency(m.expense ?? 0)}</span>
            <span className={(m.balance ?? 0) >= 0 ? 'text-[#10B981]' : 'text-rose-400'}>{formatCurrency(m.balance ?? 0)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Category Report ────────────────────────────────────────────────────────────
function CategoryReport({ year, month }: { year: number; month: number }): JSX.Element {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const loaded = useRef(false)

  const load = useCallback(async (): Promise<void> => {
    if (loaded.current) return
    loaded.current = true
    setLoading(true)
    const result = await window.api.transactions.getExpensesByCategory(
      startOfMonth(new Date(year, month - 1)),
      endOfMonth(new Date(year, month - 1))
    )
    if (result.success && result.data) setData(result.data)
    setLoading(false)
  }, [year, month])

  useState(() => { load() })

  const total = data.reduce((s: number, c: any) => s + c.amount, 0)

  if (loading) return <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin" /></div>

  return (
    <div id="report-content" className="bg-[#121418] border border-white/5 rounded-[28px] p-8">
      <h3 className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white mb-6">
        Gastos por Categoría — {format(new Date(year, month - 1), 'MMMM yyyy', { locale: es })}
      </h3>
      <p className="text-sm text-gray-400 mb-4">Total: <span className="text-rose-400 font-bold">{formatCurrency(total)}</span></p>
      <div className="space-y-3">
        {data.map((cat: any) => (
          <div key={cat.categoryId} className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
            <span className="flex-1 text-sm text-gray-300">{cat.categoryName}</span>
            <span className="text-sm font-bold text-white w-28 text-right">{formatCurrency(cat.amount)}</span>
            <span className="text-xs text-gray-500 w-12 text-right">{total > 0 ? ((cat.amount / total) * 100).toFixed(1) : 0}%</span>
            <div className="w-24">
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${total > 0 ? (cat.amount / total) * 100 : 0}%`, backgroundColor: cat.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Debts Report ───────────────────────────────────────────────────────────────
function DebtsReport(): JSX.Element {
  const [credits, setCredits] = useState<any[]>([])
  const [cards, setCards] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const loaded = useRef(false)

  const load = useCallback(async (): Promise<void> => {
    if (loaded.current) return
    loaded.current = true
    setLoading(true)
    const [c, tc] = await Promise.all([
      window.api.credits.getAll(),
      window.api.creditCards.getAll()
    ])
    if (c.success && c.data) setCredits(c.data)
    if (tc.success && tc.data) setCards(tc.data)
    setLoading(false)
  }, [])

  useState(() => { load() })

  if (loading) return <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin" /></div>

  const totalCredit = credits.reduce((s: number, c: any) => s + c.pendingAmount, 0)

  return (
    <div id="report-content" className="bg-[#121418] border border-white/5 rounded-[28px] p-8">
      <h3 className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white mb-6">Créditos y Deudas</h3>
      {credits.length > 0 && (
        <>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Créditos activos</p>
          <div className="space-y-2 mb-6">
            {credits.map((c: any) => (
              <div key={c.id} className="flex justify-between text-sm py-2 border-b border-white/5">
                <span className="text-gray-300">{c.entityName}</span>
                <div className="text-right">
                  <span className="text-rose-400 font-bold">{formatCurrency(c.pendingAmount)}</span>
                  <span className="text-gray-500 ml-2">({c.paidInstallments}/{c.totalInstallments} cuotas)</span>
                </div>
              </div>
            ))}
            <div className="flex justify-between text-sm pt-2 font-bold">
              <span className="text-white">Total créditos</span>
              <span className="text-rose-400">{formatCurrency(totalCredit)}</span>
            </div>
          </div>
        </>
      )}
      {cards.length > 0 && (
        <>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Tarjetas de crédito</p>
          <div className="space-y-2">
            {cards.map((card: any) => (
              <div key={card.id} className="flex justify-between text-sm py-2 border-b border-white/5">
                <span className="text-gray-300">{card.name} ({card.bank})</span>
                <span className="text-gray-400">Cupo: {formatCurrency(card.totalLimit)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── CSV Export ─────────────────────────────────────────────────────────────────
async function exportCSV(reportType: ReportType, year: number, month: number): Promise<void> {
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
    rows = [
      ['Tipo', 'Categoría', 'Monto'],
      ['Ingreso Total', '', String(summaryRes.data?.income ?? 0)],
      ['Gasto Total', '', String(summaryRes.data?.expense ?? 0)],
      ['Balance', '', String(summaryRes.data?.balance ?? 0)],
      [],
      ['Categoría', 'Monto', '% del total'],
      ...(catsRes.data ?? []).map((c: any) => [c.categoryName, String(c.amount), ''])
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

// ── Main Page ──────────────────────────────────────────────────────────────────
export function ReportsPage(): JSX.Element {
  const [selectedReport, setSelectedReport] = useState<ReportType>('monthly')
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [exportingCSV, setExportingCSV] = useState(false)

  // Key to force re-mount when period changes
  const reportKey = `${selectedReport}-${year}-${month}`

  const handleExportCSV = async (): Promise<void> => {
    setExportingCSV(true)
    await exportCSV(selectedReport, year, month)
    setExportingCSV(false)
  }

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

  const selectCls = 'bg-black/30 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#10B981]/50'

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-12 py-8 shrink-0 flex items-end justify-between border-b border-white/5 bg-[#08090B]/80 backdrop-blur-md sticky top-0 z-10">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#10B981] mb-2">// Módulo</p>
          <h1 className="text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-white tracking-tight">
            Reportes
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={exportingCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 text-gray-300 text-sm rounded-2xl hover:bg-white/10 border border-white/10 transition-colors"
          >
            <Download size={14} />
            {exportingCSV ? 'Exportando...' : 'Exportar CSV'}
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#10B981] text-black font-bold text-sm rounded-2xl hover:bg-[#0ea371] transition-colors shadow-lg shadow-[#10B981]/20"
          >
            <Printer size={14} />
            Imprimir / PDF
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-12 py-8 custom-scrollbar">
        {/* Report type selector */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {REPORTS.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedReport(r.id)}
              className={`bg-[#121418] border rounded-[24px] p-5 text-left transition-all duration-200 hover:border-white/20 ${selectedReport === r.id ? 'border-[#10B981]/40 bg-[#10B981]/5' : 'border-white/5'}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${selectedReport === r.id ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-white/5 text-gray-500'}`}>
                {r.icon}
              </div>
              <p className="text-sm font-bold text-white">{r.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>
            </button>
          ))}
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-4 mb-6">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={selectCls}>
            {months.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={selectCls}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <p className="text-sm text-gray-500">Período seleccionado</p>
        </div>

        {/* Report content */}
        <div key={reportKey}>
          {selectedReport === 'monthly' && <MonthlyReport year={year} month={month} />}
          {selectedReport === 'annual' && <AnnualReport year={year} />}
          {selectedReport === 'categories' && <CategoryReport year={year} month={month} />}
          {selectedReport === 'debts' && <DebtsReport />}
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .px-12 { padding: 20px !important; }
          button, nav, aside { display: none !important; }
          #report-content { border: 1px solid #ccc !important; color: black !important; background: white !important; }
        }
      `}</style>
    </div>
  )
}
