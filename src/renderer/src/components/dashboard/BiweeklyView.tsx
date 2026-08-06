import { useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Wallet, TrendingUp, TrendingDown, PiggyBank, CalendarRange, ArrowUpRight } from 'lucide-react'
import { formatCurrency, getQuincena, cn, type Quincena } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { InsightsRow } from './InsightsRow'
import { IncomeVsExpenseChart } from './IncomeVsExpenseChart'
import { Progress } from '@/components/ui/progress'
import { Activity } from 'lucide-react'
import type { BiweeklyData } from '../../../../shared/types'

const SHORT_MONTH_LABELS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
]

const MONTH_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

function getPrevPeriod(year: number, month: number, quincena: Quincena): { year: number; month: number; quincena: Quincena } {
  if (quincena === 'Q2') {
    return { year, month, quincena: 'Q1' }
  }
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  return { year: prevYear, month: prevMonth, quincena: 'Q2' }
}

function HeroCard({
  data,
  prevData,
  loading
}: {
  data: BiweeklyData | null
  prevData: BiweeklyData | null
  loading: boolean
}): JSX.Element {
  const available = data?.available ?? 0
  const isPositive = available >= 0

  const spend = (data?.committed ?? 0) + (data?.spent ?? 0)
  const prevSpend = (prevData?.committed ?? 0) + (prevData?.spent ?? 0)
  const spendChange = prevSpend > 0 ? ((spend - prevSpend) / prevSpend) * 100 : 0
  const spentLess = spendChange <= 0

  return (
    <div className="col-span-12 lg:col-span-8 bg-[#121418] border border-white/5 rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.2)] p-10 flex flex-col justify-between min-h-[300px] relative overflow-hidden group">
      {/* Glow decorativo */}
      <div className="absolute -right-20 -top-20 w-96 h-96 bg-[#10B981] opacity-5 blur-[100px] rounded-full pointer-events-none" />

      <div className="flex justify-between items-start relative z-10">
        <div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-3">
            <Wallet size={14} />
            Disponible de la Quincena
          </span>

          {loading ? (
            <Skeleton className="h-20 w-72 mt-6 rounded-2xl bg-white/5" />
          ) : (
            <div className="flex items-baseline gap-4 mt-6">
              <span className="text-4xl text-gray-600 font-light font-['Plus_Jakarta_Sans',sans-serif]">
                $
              </span>
              <h2
                className={cn(
                  "text-7xl font-['Plus_Jakarta_Sans',sans-serif] font-bold tracking-tighter leading-none",
                  isPositive ? 'text-white' : 'text-rose-500'
                )}
              >
                {Math.abs(available).toLocaleString('es-CO')}
              </h2>
            </div>
          )}
        </div>

        <div className="text-right">
          <div
            className={cn(
              'px-4 py-2 rounded-2xl border inline-flex items-center gap-2',
              isPositive
                ? 'bg-emerald-500/10 text-[#10B981] border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            )}
          >
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span className="font-bold text-sm">{isPositive ? 'Saldo a favor' : 'Sobregiro'}</span>
          </div>
          {prevData && (
            <p
              className={cn(
                'text-[10px] mt-2 font-bold uppercase tracking-wider',
                spentLess ? 'text-[#10B981]' : 'text-rose-400'
              )}
            >
              {spentLess ? '▼' : '▲'} {Math.abs(spendChange).toFixed(1)}% vs quincena anterior
            </p>
          )}
        </div>
      </div>

      {/* Stats footer */}
      <div className="flex items-center gap-12 mt-12 border-t border-white/5 pt-10 relative z-10">
        <div>
          <p className="text-[10px] text-gray-600 uppercase font-bold tracking-wider mb-2">Ingreso</p>
          <p className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-gray-200">
            {loading ? '—' : formatCurrency(data?.income ?? 0)}
          </p>
        </div>
        <div className="h-10 w-px bg-white/5" />
        <div>
          <p className="text-[10px] text-gray-600 uppercase font-bold tracking-wider mb-2">Comprometido</p>
          <p className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-amber-400">
            {loading ? '—' : formatCurrency(data?.committed ?? 0)}
          </p>
        </div>
        <div className="h-10 w-px bg-white/5" />
        <div>
          <p className="text-[10px] text-gray-600 uppercase font-bold tracking-wider mb-2">Gastado</p>
          <p className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-rose-500">
            {loading ? '—' : formatCurrency(data?.spent ?? 0)}
          </p>
        </div>
      </div>
    </div>
  )
}

function CommitmentsCard({
  month,
  year,
  quincena,
  data,
  loading,
  onPrev,
  onNext
}: {
  month: number
  year: number
  quincena: Quincena
  data: BiweeklyData | null
  loading: boolean
  onPrev: () => void
  onNext: () => void
}): JSX.Element {
  const items = data?.committedItems ?? []

  return (
    <div className="col-span-12 lg:col-span-4 bg-[#121418] border border-white/5 rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.2)] p-10 flex flex-col min-h-[300px]">
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
            {quincena === 'Q1' ? 'Primera quincena' : 'Segunda quincena'}
          </p>
          <h3 className="text-lg font-['Plus_Jakarta_Sans',sans-serif] font-bold">
            {MONTH_LABELS[month - 1]} {year}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onPrev}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
          >
            <ChevronLeft size={15} />
          </button>
          <div className="w-9 h-9 bg-[#10B981]/10 rounded-xl flex items-center justify-center text-[#10B981] border border-[#10B981]/20 shrink-0">
            <CalendarRange size={16} />
          </div>
          <button
            onClick={onNext}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">
        Compromisos de la quincena
      </p>

      {loading ? (
        <Skeleton className="h-40 rounded-xl bg-white/5" />
      ) : items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-600 text-center">
            Sin compromisos programados en esta quincena
          </p>
        </div>
      ) : (
        <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar max-h-[220px] pr-1">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-rose-500/10 text-rose-400">
                <ArrowUpRight size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-300 truncate">{item.name}</p>
                <p className="text-[10px] text-gray-600 font-['JetBrains_Mono',monospace]">
                  {format(new Date(item.nextDate), 'EEE d', { locale: es })}
                </p>
              </div>
              <span className="text-sm font-bold font-['Plus_Jakarta_Sans',sans-serif] text-rose-500">
                -{formatCurrency(item.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PaceCard({ data, loading }: { data: BiweeklyData | null; loading: boolean }): JSX.Element {
  let daysElapsedPct = 0
  let spentPct = 0
  let isAhead = false

  if (data) {
    const start = new Date(data.rangeStart)
    const end = new Date(data.rangeEnd)
    const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)
    const now = new Date()
    const elapsedDays = Math.min(
      totalDays,
      Math.max(0, Math.round((now.getTime() - start.getTime()) / 86400000) + 1)
    )
    daysElapsedPct = Math.min(100, Math.round((elapsedDays / totalDays) * 100))

    const budget = data.income
    const used = data.committed + data.spent
    spentPct = budget > 0 ? Math.min(100, Math.round((used / budget) * 100)) : 0
    isAhead = spentPct > daysElapsedPct
  }

  return (
    <div className="col-span-12 lg:col-span-3 bg-[#121418] border border-white/5 rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.2)] p-8 flex flex-col justify-center gap-6 min-h-[350px]">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-[#10B981]/10 rounded-xl flex items-center justify-center text-[#10B981] border border-[#10B981]/20">
          <Activity size={16} />
        </div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ritmo de gasto</p>
      </div>

      {loading ? (
        <Skeleton className="h-32 rounded-xl bg-white/5" />
      ) : (
        <>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Días transcurridos</span>
              <span className="font-bold text-gray-300">{daysElapsedPct}%</span>
            </div>
            <Progress value={daysElapsedPct} variant="blue" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Ingreso usado</span>
              <span className={cn('font-bold', isAhead ? 'text-rose-400' : 'text-[#10B981]')}>
                {spentPct}%
              </span>
            </div>
            <Progress value={spentPct} variant={isAhead ? 'rose' : 'emerald'} glow={isAhead} />
          </div>

          <p className={cn('text-[11px] leading-relaxed', isAhead ? 'text-rose-400' : 'text-gray-500')}>
            {isAhead
              ? 'Vas gastando más rápido de lo que avanza la quincena.'
              : 'Tu ritmo de gasto va acorde con los días de la quincena.'}
          </p>
        </>
      )}
    </div>
  )
}

function ComparisonCard({
  label,
  d,
  loading,
  active
}: {
  label: string
  d: BiweeklyData | null
  loading: boolean
  active: boolean
}): JSX.Element {
  const gasto = (d?.committed ?? 0) + (d?.spent ?? 0)
  return (
    <div
      className={cn(
        'bg-[#0F1115] border rounded-2xl p-6 space-y-4 transition-all',
        active ? 'border-[#10B981]/30' : 'border-white/5'
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        {active && (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
            Actual
          </span>
        )}
      </div>
      {loading ? (
        <Skeleton className="h-16 rounded-xl bg-white/5" />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 flex items-center gap-1.5">
              <TrendingUp size={12} className="text-[#10B981]" />
              Ingreso
            </span>
            <span className="text-sm font-bold font-['Plus_Jakarta_Sans',sans-serif] text-[#10B981]">
              {formatCurrency(d?.income ?? 0)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 flex items-center gap-1.5">
              <TrendingDown size={12} className="text-rose-400" />
              Gasto (fijo + real)
            </span>
            <span className="text-sm font-bold font-['Plus_Jakarta_Sans',sans-serif] text-rose-400">
              {formatCurrency(gasto)}
            </span>
          </div>
        </>
      )}
    </div>
  )
}

export function BiweeklyView(): JSX.Element {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [quincena, setQuincena] = useState<Quincena>(getQuincena(now))

  const [q1Data, setQ1Data] = useState<BiweeklyData | null>(null)
  const [q2Data, setQ2Data] = useState<BiweeklyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [topCategory, setTopCategory] = useState<{ name: string; amount: number } | null>(null)
  const [prevData, setPrevData] = useState<BiweeklyData | null>(null)
  const [history, setHistory] = useState<Array<{ label: string; income: number; expense: number }>>([])

  const load = useCallback(async () => {
    setLoading(true)
    const [q1Res, q2Res] = await Promise.all([
      window.api.dashboard.getBiweeklyData(year, month, 'Q1'),
      window.api.dashboard.getBiweeklyData(year, month, 'Q2')
    ])
    if (q1Res.success) setQ1Data(q1Res.data)
    if (q2Res.success) setQ2Data(q2Res.data)
    setLoading(false)
  }, [year, month])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const prev = getPrevPeriod(year, month, quincena)
    window.api.dashboard.getBiweeklyData(prev.year, prev.month, prev.quincena).then((res: any) => {
      if (res.success) setPrevData(res.data)
    }).catch(() => setPrevData(null))
  }, [year, month, quincena])

  useEffect(() => {
    let periods: Array<{ year: number; month: number; quincena: Quincena }> = [{ year, month, quincena }]
    for (let i = 0; i < 5; i++) {
      periods.push(getPrevPeriod(periods[periods.length - 1].year, periods[periods.length - 1].month, periods[periods.length - 1].quincena))
    }
    periods = periods.reverse()

    Promise.all(
      periods.map((p) => window.api.dashboard.getBiweeklyData(p.year, p.month, p.quincena))
    ).then((results) => {
      const points = results.map((res: any, i: number) => {
        const p = periods[i]
        const d = res.success ? res.data : null
        return {
          label: `${SHORT_MONTH_LABELS[p.month - 1]} ${p.quincena}`,
          income: Math.round(d?.income ?? 0),
          expense: Math.round((d?.committed ?? 0) + (d?.spent ?? 0))
        }
      })
      setHistory(points)
    }).catch(() => {})
  }, [year, month, quincena])

  useEffect(() => {
    const activeRange = quincena === 'Q1' ? q1Data : q2Data
    if (!activeRange) return
    window.api.transactions
      .getExpensesByCategory(activeRange.rangeStart, activeRange.rangeEnd)
      .then((res: any) => {
        if (res.success && res.data && res.data.length > 0) {
          const sorted = [...res.data].sort((a: any, b: any) => b.amount - a.amount)
          setTopCategory({ name: sorted[0].categoryName, amount: sorted[0].amount })
        } else {
          setTopCategory(null)
        }
      })
      .catch(() => setTopCategory(null))
  }, [quincena, q1Data, q2Data])

  const goToPrevQuincena = (): void => {
    if (quincena === 'Q2') {
      setQuincena('Q1')
      return
    }
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    setMonth(prevMonth)
    setYear(prevYear)
    setQuincena('Q2')
  }

  const goToNextQuincena = (): void => {
    if (quincena === 'Q1') {
      setQuincena('Q2')
      return
    }
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    setMonth(nextMonth)
    setYear(nextYear)
    setQuincena('Q1')
  }

  const activeData = quincena === 'Q1' ? q1Data : q2Data

  return (
    <>
      {/* ── Row 1: Disponible + Navegación de período ────────────────── */}
      <section className="grid grid-cols-12 gap-8">
        <HeroCard data={activeData} prevData={prevData} loading={loading} />
        <CommitmentsCard
          month={month}
          year={year}
          quincena={quincena}
          data={activeData}
          loading={loading}
          onPrev={goToPrevQuincena}
          onNext={goToNextQuincena}
        />
      </section>

      {/* ── Row 2: Histórico de quincenas + Ritmo de gasto ─────────────── */}
      <section className="grid grid-cols-12 gap-8">
        <IncomeVsExpenseChart data={history} subtitle="Comparativa de las últimas 6 quincenas" />
        <PaceCard data={activeData} loading={loading} />
      </section>

      {/* ── Row 3: Comparativa Q1 vs Q2 + Insights ────────────────────── */}
      <section className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-6 bg-[#121418] border border-white/5 rounded-[28px] p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#10B981]/10 rounded-xl flex items-center justify-center text-[#10B981] border border-[#10B981]/20">
              <PiggyBank size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Comparativa del mes</p>
              <p className="text-xs text-gray-500">{MONTH_LABELS[month - 1]} {year}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6">
            <ComparisonCard label="Primera quincena" d={q1Data} loading={loading} active={quincena === 'Q1'} />
            <ComparisonCard label="Segunda quincena" d={q2Data} loading={loading} active={quincena === 'Q2'} />
          </div>
        </div>

        <InsightsRow
          monthIncome={activeData?.income ?? 0}
          monthExpense={(activeData?.committed ?? 0) + (activeData?.spent ?? 0)}
          topCategory={topCategory}
        />
      </section>
    </>
  )
}
