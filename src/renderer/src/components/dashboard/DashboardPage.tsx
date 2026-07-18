import { useState, useEffect, useCallback } from 'react'
import { FileDown } from 'lucide-react'
import { addDays, format, startOfMonth, endOfMonth, differenceInCalendarDays, setDate, isAfter } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { LiquidityCard } from './LiquidityCard'
import { PaydayCard } from './PaydayCard'
import { TelemetryChart } from './TelemetryChart'
import { HealthGauge } from './HealthGauge'
import { DecisionLog } from './DecisionLog'
import { GoalsCard } from './GoalsCard'
import { InsightsRow } from './InsightsRow'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboard } from '@/hooks/useDashboard'

export function DashboardPage(): JSX.Element {
  const { data, loading } = useDashboard()
  const navigate = useNavigate()

  // ── Datos complementarios que no vienen del DashboardService ─────────────
  const [healthScore, setHealthScore] = useState<number | null>(null)
  const [telemetryData, setTelemetryData] = useState<Array<{ label: string; value: number }>>([])
  const [historicalData, setHistoricalData] = useState<Array<{ label: string; value: number }>>([])
  const [projectedValue, setProjectedValue] = useState(0)
  const [decisionLog, setDecisionLog] = useState<Array<{ level: 'SAFE' | 'WARN' | 'INFO' | 'ERR'; message: string }>>([])
  const [topCategory, setTopCategory] = useState<{ name: string; amount: number } | null>(null)
  const [daysUntilPayday, setDaysUntilPayday] = useState(0)

  const loadSupplementalData = useCallback(async () => {
    // 1. Score de salud financiera real
    window.api.health.getScore().then((result: any) => {
      if (result.success && result.data) {
        setHealthScore(result.data.score)
      }
    }).catch(() => {})

    // 2. Proyección de flujo de caja acumulado (TelemetryChart)
    //    getProjection devuelve eventos individuales → los agrupamos por mes y calculamos saldo acumulado
    Promise.all([
      window.api.recurring.getProjection(6),
      window.api.accounts.getTotalBalance()
    ]).then(([projResult, balResult]) => {
      const events: Array<{ date: any; type: string; amount: number }> =
        (projResult.success && projResult.data) ? projResult.data : []
      const currentBalance: number =
        (balResult.success && balResult.data != null) ? balResult.data : 0

      if (events.length === 0) return

      // Agrupar por mes y calcular saldo acumulado
      const monthMap = new Map<string, number>()
      for (const ev of events) {
        const d = new Date(ev.date)
        const key = format(d, 'MMM yy', { locale: es })
        const delta = ev.type === 'INCOME' ? ev.amount : -ev.amount
        monthMap.set(key, (monthMap.get(key) ?? 0) + delta)
      }

      // Saldo acumulado mes a mes
      let running = currentBalance
      const points: Array<{ label: string; value: number }> = [
        { label: 'Hoy', value: Math.round(currentBalance) }
      ]
      for (const [label, delta] of monthMap.entries()) {
        running += delta
        points.push({ label, value: Math.round(running) })
      }

      setTelemetryData(points)
      setProjectedValue(running)
    }).catch(() => {})

    // 3. Datos históricos del tab "Histórico" (últimos 6 meses de cashflow real)
    const now = new Date()
    const promises = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      return window.api.transactions.getMonthSummary(d.getFullYear(), d.getMonth() + 1)
        .then((r: any) => ({
          label: format(d, 'MMM yy', { locale: es }),
          value: r.success && r.data ? Math.round(r.data.balance) : 0
        }))
    })
    Promise.all(promises).then((results) => {
      setHistoricalData(results)
    }).catch(() => {})

    // 4. Alertas para el Decision Log
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

    // 5. Top categoría de gasto del mes actual
    const nowInsights = new Date()
    const ms = startOfMonth(nowInsights)
    const me = endOfMonth(nowInsights)
    window.api.transactions.getExpensesByCategory(ms, me).then((result: any) => {
      if (result.success && result.data && result.data.length > 0) {
        const sorted = [...result.data].sort((a: any, b: any) => b.amount - a.amount)
        setTopCategory({ name: sorted[0].categoryName, amount: sorted[0].amount })
      }
    }).catch(() => {})

    // 6. Días hasta próximo pago
    window.api.config.get().then((result: any) => {
      if (result.success && result.data) {
        const payDay: number = result.data.payDay
        const today = new Date()
        let nextPayday = setDate(today, payDay)
        if (isAfter(setDate(today, 1), nextPayday) || nextPayday.getTime() === today.getTime()) {
          // If payDay already passed this month, target next month
          nextPayday = setDate(addDays(endOfMonth(today), 1), payDay)
        }
        setDaysUntilPayday(differenceInCalendarDays(nextPayday, today))
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

  // Próximo pago recurrente de tipo INCOME como "próxima quincena"
  const nextIncome = data?.upcomingPayments?.find((p) => p.type === 'INCOME')
  const nextPayment = data?.upcomingPayments?.find((p) => p.type !== 'INCOME')
  const paydayItem = nextIncome ?? nextPayment ?? data?.upcomingPayments?.[0]
  const paydayAmount = paydayItem?.amount ?? 0
  const paydayDate = paydayItem?.nextDate
    ? (paydayItem.nextDate instanceof Date ? paydayItem.nextDate : new Date(paydayItem.nextDate))
    : addDays(new Date(), 15)

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

  return (
    <div className="max-w-[1600px] mx-auto p-12 space-y-12">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="flex justify-between items-end">
        <div>
          <p className="text-[10px] font-bold text-[#10B981] uppercase tracking-[0.4em] mb-3">
            Horizonte v1.0 // Sistema Activo
          </p>
          <h1 className="text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold tracking-tight">
            Financial Command Center
          </h1>
        </div>

        <div className="flex items-center gap-10">
          <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">
              Estado
            </p>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-sm font-['JetBrains_Mono',monospace] font-bold text-gray-300">
                Online
              </span>
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            </div>
          </div>

          <button
            onClick={() => navigate('/reportes')}
            className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
          >
            <FileDown size={14} />
            Exportar Reporte
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
            <PaydayCard
              amount={paydayAmount}
              date={paydayDate}
              isPositiveCashflow={monthIncome >= monthExpense}
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
            <TelemetryChart
              data={telemetryData}
              historicalData={historicalData}
              projectedValue={projectedValue > 0 ? projectedValue : totalBalance}
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
              daysUntilPayday={daysUntilPayday}
            />
          </>
        )}
      </section>
    </div>
  )
}
