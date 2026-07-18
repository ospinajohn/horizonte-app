import { useState, useEffect, useCallback } from 'react'
import { FileDown } from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { LiquidityCard } from './LiquidityCard'
import { CashflowCard } from './CashflowCard'
import { IncomeVsExpenseChart } from './IncomeVsExpenseChart'
import { HealthGauge } from './HealthGauge'
import { DecisionLog } from './DecisionLog'
import { GoalsCard } from './GoalsCard'
import { InsightsRow } from './InsightsRow'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboard } from '@/hooks/useDashboard'
import { TransactionFormModal } from '../transactions/TransactionFormModal'

export function DashboardPage(): JSX.Element {
  const { data, loading, refetch } = useDashboard()
  const navigate = useNavigate()
  const [quickFormOpen, setQuickFormOpen] = useState(false)
  const [quickFormMode, setQuickFormMode] = useState<'income' | 'expense'>('income')

  const openQuickForm = (mode: 'income' | 'expense'): void => {
    setQuickFormMode(mode)
    setQuickFormOpen(true)
  }

  // ── Datos complementarios que no vienen del DashboardService ─────────────
  const [healthScore, setHealthScore] = useState<number | null>(null)
  const [monthlyComparison, setMonthlyComparison] = useState<Array<{ label: string; income: number; expense: number }>>([])
  const [decisionLog, setDecisionLog] = useState<Array<{ level: 'SAFE' | 'WARN' | 'INFO' | 'ERR'; message: string }>>([])
  const [topCategory, setTopCategory] = useState<{ name: string; amount: number } | null>(null)

  const loadSupplementalData = useCallback(async () => {
    // 1. Score de salud financiera real
    window.api.health.getScore().then((result: any) => {
      if (result.success && result.data) {
        setHealthScore(result.data.score)
      }
    }).catch(() => {})

    // 2. Comparativa mensual Ingresos vs Gastos (últimos 6 meses)
    const now = new Date()
    const promises = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      return window.api.transactions.getMonthSummary(d.getFullYear(), d.getMonth() + 1)
        .then((r: any) => ({
          label: format(d, 'MMM', { locale: es }),
          income: r.success && r.data ? Math.round(r.data.income) : 0,
          expense: r.success && r.data ? Math.round(r.data.expense) : 0
        }))
    })
    Promise.all(promises).then((results) => {
      setMonthlyComparison(results)
    }).catch(() => {})

    // 3. Alertas para el Decision Log
    window.api.alerts.getAll(false).then((result: any) => {
      if (result.success && result.data && result.data.length > 0) {
        const entries = result.data.slice(0, 5).map((alert: any) => {
          let level: 'SAFE' | 'WARN' | 'INFO' | 'ERR' = 'INFO'
          if (alert.severity === 'INFO') level = 'SAFE'
          else if (alert.severity === 'WARNING') level = 'WARN'
          else if (alert.severity === 'CRITICAL') level = 'ERR'
          return { level, message: `${alert.title} — ${alert.message}` }
        })
        setDecisionLog(entries)
      }
    }).catch(() => {})

    // 4. Top categoría de gasto del mes actual
    const ms = startOfMonth(now)
    const me = endOfMonth(now)
    window.api.transactions.getExpensesByCategory(ms, me).then((result: any) => {
      if (result.success && result.data && result.data.length > 0) {
        const sorted = [...result.data].sort((a: any, b: any) => b.amount - a.amount)
        setTopCategory({ name: sorted[0].categoryName, amount: sorted[0].amount })
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    loadSupplementalData()
  }, [loadSupplementalData])

  // ── Valores derivados del DashboardService ────────────────────────────────
  const totalBalance = data?.totalBalance ?? 0
  const monthIncome = data?.monthIncome ?? 0
  const monthExpense = data?.monthExpense ?? 0
  const prevMonthIncome = data?.prevMonthIncome ?? 0
  const prevMonthExpense = data?.prevMonthExpense ?? 0

  const goals = data?.topGoals?.map((g, idx) => {
    const variants: Array<'emerald' | 'blue' | 'amber' | 'rose'> = ['emerald', 'blue', 'amber', 'rose']
    const pct = g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0
    return {
      id: g.id,
      name: g.name,
      percentage: Math.min(pct, 100),
      variant: variants[idx % variants.length]
    }
  }) ?? []

  const hour = new Date().getHours()
  let greeting = 'Buenas noches'
  if (hour >= 5 && hour < 12) greeting = 'Buenos días'
  else if (hour >= 12 && hour < 19) greeting = 'Buenas tardes'

  const currentDateFormatted = format(new Date(), "EEEE, d 'de' MMMM", { locale: es })
  const capitalizedDate = currentDateFormatted.charAt(0).toUpperCase() + currentDateFormatted.slice(1)

  return (
    <div className="max-w-[1600px] mx-auto p-12 space-y-12">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 bg-[#0A0A0A]/50 p-8 rounded-[32px] border border-white/5 relative overflow-hidden backdrop-blur-md">
        {/* Efecto Glow de fondo */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#10B981]/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10">
          <p className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            {capitalizedDate}
          </p>
          <h1 className="text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold tracking-tight text-white flex items-center gap-3">
            {greeting}, John <span className="text-3xl origin-bottom-right hover:animate-ping cursor-default">👋</span>
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Resumen general de tu actividad financiera
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={() => openQuickForm('income')}
            className="px-6 py-3.5 bg-gradient-to-r from-[#10B981]/10 to-[#10B981]/5 text-[#10B981] border border-[#10B981]/20 rounded-2xl text-sm font-bold hover:bg-[#10B981] hover:text-[#0A0A0A] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
          >
            <span className="text-lg leading-none">+</span> Ingreso Rápido
          </button>

          <button
            onClick={() => openQuickForm('expense')}
            className="px-6 py-3.5 bg-gradient-to-r from-rose-500/10 to-rose-500/5 text-rose-500 border border-rose-500/20 rounded-2xl text-sm font-bold hover:bg-rose-500 hover:text-white hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.1)]"
          >
            <span className="text-lg leading-none">-</span> Gasto Rápido
          </button>

          <div className="w-[1px] h-8 bg-white/10 mx-2 hidden sm:block"></div>

          <button
            onClick={() => navigate('/reportes')}
            className="px-4 py-2 bg-white/5 rounded-xl text-xs text-gray-500 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5"
          >
            <FileDown size={13} />
            Exportar
          </button>
        </div>
      </header>

      {/* ── Row 1: Balance + Próxima quincena ──────────────────────────── */}
      <section className="grid grid-cols-12 gap-8">
        {loading ? (
          <>
            <div className="col-span-12 lg:col-span-8">
              <Skeleton className="h-[300px] rounded-[28px] bg-white/5" />
            </div>
            <div className="col-span-12 lg:col-span-4">
              <Skeleton className="h-[300px] rounded-[28px] bg-white/5" />
            </div>
          </>
        ) : (
          <>
            <LiquidityCard
              totalBalance={totalBalance}
              monthIncome={monthIncome}
              monthExpense={monthExpense}
              totalDebt={0}
              prevMonthIncome={prevMonthIncome}
              prevMonthExpense={prevMonthExpense}
            />
            <CashflowCard
              events={data?.upcomingPayments ?? []}
            />
          </>
        )}
      </section>

      {/* ── Row 2: Chart + Salud + Terminal ────────────────────────────── */}
      <section className="grid grid-cols-12 gap-8">
        {loading ? (
          <>
            <div className="col-span-12 lg:col-span-9">
              <Skeleton className="h-[350px] rounded-[28px] bg-white/5" />
            </div>
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-8">
              <Skeleton className="h-[200px] rounded-[28px] bg-white/5" />
              <Skeleton className="h-[160px] rounded-[28px] bg-white/5" />
            </div>
          </>
        ) : (
          <>
            <IncomeVsExpenseChart
              data={monthlyComparison}
            />
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-8">
              <HealthGauge
                score={healthScore ?? 0}
                loading={healthScore === null}
                onViewRecommendations={() => navigate('/salud')}
              />
              <DecisionLog
                entries={decisionLog.length > 0 ? decisionLog : [
                  { level: 'INFO', message: 'Sin alertas activas — todo bajo control' }
                ]}
              />
            </div>
          </>
        )}
      </section>

      {/* ── Row 3: Metas + Insights ───────────────────────────────────── */}
      <section className="grid grid-cols-12 gap-8 pb-20">
        {loading ? (
          <>
            <div className="col-span-12 lg:col-span-6">
              <Skeleton className="h-[300px] rounded-[28px] bg-white/5" />
            </div>
            <div className="col-span-12 lg:col-span-6">
              <Skeleton className="h-[300px] rounded-[28px] bg-white/5" />
            </div>
          </>
        ) : (
          <>
            <GoalsCard
              goals={goals}
              onViewAll={() => navigate('/metas')}
            />
            <InsightsRow
              monthIncome={monthIncome}
              monthExpense={monthExpense}
              topCategory={topCategory}
            />
          </>
        )}
      </section>

      <TransactionFormModal
        open={quickFormOpen}
        onClose={() => setQuickFormOpen(false)}
        onSuccess={() => {
          setQuickFormOpen(false)
          refetch()
          loadSupplementalData()
        }}
        mode={quickFormMode}
      />
    </div>
  )
}
