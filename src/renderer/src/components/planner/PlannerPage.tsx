import { useState, useEffect, useCallback } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts'
import { ChevronLeft, ChevronRight, CalendarDays, TrendingUp, TrendingDown } from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek
} from 'date-fns'
import { es } from 'date-fns/locale'
import { formatCurrency, cn } from '@/lib/utils'

type ViewRange = '1M' | '3M' | '6M' | '1A'

interface ProjectionPoint {
  date: Date
  name: string
  type: string
  amount: number
  categoryName: string | null
  color: string | null
}

interface ChartPoint {
  label: string
  balance: number
  date: Date
}

interface DayEvent {
  name: string
  type: string
  amount: number
  color: string | null
}

// Tooltip personalizado del chart
function CustomTooltip({ active, payload }: any): JSX.Element | null {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload as ChartPoint
  if (!point) return null
  return (
    <div className="bg-black/90 border border-white/10 rounded-2xl px-4 py-3 backdrop-blur-md text-sm shadow-xl">
      <p className="text-gray-400 text-[11px] uppercase tracking-wider mb-1">
        {format(point.date, "d 'de' MMMM yyyy", { locale: es })}
      </p>
      <p
        className={cn(
          "font-['Plus_Jakarta_Sans',sans-serif] font-bold text-base",
          point.balance >= 0 ? 'text-[#10B981]' : 'text-rose-400'
        )}
      >
        {formatCurrency(point.balance)}
      </p>
    </div>
  )
}

export function PlannerPage(): JSX.Element {
  const [viewRange, setViewRange] = useState<ViewRange>('3M')
  const [projectionData, setProjectionData] = useState<ProjectionPoint[]>([])
  const [initialBalance, setInitialBalance] = useState(0)
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [loadingChart, setLoadingChart] = useState(true)

  // Calendario
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [dayEvents, setDayEvents] = useState<DayEvent[]>([])

  // Próximos eventos
  const [upcomingEvents, setUpcomingEvents] = useState<ProjectionPoint[]>([])

  const rangeMonths: Record<ViewRange, number> = {
    '1M': 1, '3M': 3, '6M': 6, '1A': 12
  }

  const loadData = useCallback(async () => {
    setLoadingChart(true)
    try {
      const [projResult, balResult] = await Promise.all([
        window.api.recurring.getProjection(12),
        window.api.accounts.getTotalBalance()
      ])

      const points: ProjectionPoint[] = (projResult.success && projResult.data)
        ? projResult.data.map((p: any) => ({ ...p, date: new Date(p.date) }))
        : []

      const balance = (balResult.success && balResult.data != null)
        ? balResult.data
        : 0

      setProjectionData(points)
      setInitialBalance(balance)

      // Próximos 30 días
      const now = new Date()
      const in30 = new Date()
      in30.setDate(in30.getDate() + 30)
      setUpcomingEvents(points.filter((p) => p.date >= now && p.date <= in30))
    } catch {
      // silent
    } finally {
      setLoadingChart(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Build chart data whenever viewRange or projection changes
  useEffect(() => {
    if (projectionData.length === 0 && initialBalance === 0) return

    const months = rangeMonths[viewRange]
    const now = new Date()
    const until = new Date()
    until.setMonth(until.getMonth() + months)

    // Generar puntos diarios acumulados
    let runningBalance = initialBalance
    const days = eachDayOfInterval({ start: now, end: until })

    const points: ChartPoint[] = days.map((day) => {
      // Aplicar eventos de ese día
      const dayItems = projectionData.filter((p) => isSameDay(p.date, day))
      for (const item of dayItems) {
        if (item.type === 'INCOME') {
          runningBalance += item.amount
        } else {
          runningBalance -= item.amount
        }
      }
      return {
        label: format(day, 'MMM d', { locale: es }),
        balance: runningBalance,
        date: day
      }
    })

    // Para el chart, muestrear para no sobrecargar (máx 60 puntos)
    const step = Math.max(1, Math.floor(points.length / 60))
    setChartData(points.filter((_, i) => i % step === 0 || i === points.length - 1))
  }, [projectionData, initialBalance, viewRange])

  // Obtener días del calendario para el mes visible
  const calendarStart = startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(endOfMonth(calendarMonth), { weekStartsOn: 1 })
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Días con eventos en el mes visible
  const getDayEvents = (day: Date): DayEvent[] => {
    return projectionData
      .filter((p) => isSameDay(p.date, day))
      .map((p) => ({ name: p.name, type: p.type, amount: p.amount, color: p.color }))
  }

  const handleDayClick = (day: Date): void => {
    const events = getDayEvents(day)
    if (events.length > 0) {
      setSelectedDay(day)
      setDayEvents(events)
    } else {
      setSelectedDay(null)
      setDayEvents([])
    }
  }

  const isPositive = chartData.length > 0 && chartData[chartData.length - 1].balance >= 0
  const chartColor = isPositive ? '#10B981' : '#F43F5E'

  const VIEW_LABELS: ViewRange[] = ['1M', '3M', '6M', '1A']

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-12 py-8 shrink-0 border-b border-white/5 bg-[#08090B]/80 backdrop-blur-md sticky top-0 z-10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#10B981] mb-2">
          // Proyecciones
        </p>
        <h1 className="text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-white tracking-tight">
          Planificador
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-12 py-8 space-y-8 custom-scrollbar">

        {/* ── Sección 1: Proyección de saldo ─────────────────────────────────── */}
        <div className="bg-[#121418] border border-white/5 rounded-[28px] p-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                Proyección acumulada
              </p>
              <h2 className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-white">
                Flujo de Saldo Proyectado
              </h2>
            </div>
            {/* Toggle de rango */}
            <div className="flex items-center gap-1 bg-black/40 rounded-2xl p-1 border border-white/5">
              {VIEW_LABELS.map((v) => (
                <button
                  key={v}
                  onClick={() => setViewRange(v)}
                  className={cn(
                    'h-8 px-4 rounded-xl text-xs font-bold transition-all',
                    viewRange === v
                      ? 'bg-[#10B981] text-black'
                      : 'text-gray-500 hover:text-white'
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {loadingChart ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-pulse w-full h-full bg-white/[0.02] rounded-2xl" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center">
              <CalendarDays size={32} className="text-gray-600 mb-3" />
              <p className="text-sm text-gray-500">Sin eventos recurrentes configurados</p>
              <p className="text-xs text-gray-600 mt-1">Agrega pagos recurrentes para ver la proyección</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="1 8" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#4B5563', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: '#4B5563', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => {
                    const abs = Math.abs(v)
                    if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
                    if (abs >= 1_000) return `${(v / 1_000).toFixed(0)}k`
                    return String(v)
                  }}
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke={chartColor}
                  strokeWidth={2.5}
                  fill="url(#areaGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: chartColor, stroke: '#121418', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Sección 2: Calendario + eventos ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendario */}
          <div className="lg:col-span-2 bg-[#121418] border border-white/5 rounded-[28px] p-8">
            {/* Nav del mes */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-white capitalize">
                {format(calendarMonth, 'MMMM yyyy', { locale: es })}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Días de semana */}
            <div className="grid grid-cols-7 mb-2">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
                <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-gray-600 pb-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Grid de días */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const isCurrentMonth = isSameMonth(day, calendarMonth)
                const isToday = isSameDay(day, new Date())
                const isSelected = selectedDay && isSameDay(day, selectedDay)
                const events = getDayEvents(day)
                const hasIncome = events.some((e) => e.type === 'INCOME')
                const hasExpense = events.some((e) => e.type !== 'INCOME')

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleDayClick(day)}
                    className={cn(
                      'relative flex flex-col items-center py-2 rounded-xl transition-all min-h-[52px]',
                      !isCurrentMonth && 'opacity-25',
                      isToday && 'bg-[#10B981]/10',
                      isSelected && 'bg-[#10B981]/20 ring-1 ring-[#10B981]/40',
                      !isToday && !isSelected && 'hover:bg-white/5',
                      events.length > 0 && 'cursor-pointer'
                    )}
                  >
                    <span className={cn(
                      'text-sm font-medium',
                      isToday ? 'text-[#10B981]' : isCurrentMonth ? 'text-white' : 'text-gray-600'
                    )}>
                      {format(day, 'd')}
                    </span>
                    {/* Puntos de eventos */}
                    {(hasIncome || hasExpense) && (
                      <div className="flex gap-0.5 mt-1">
                        {hasIncome && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                        )}
                        {hasExpense && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Panel de eventos del día seleccionado */}
          <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8">
            {selectedDay ? (
              <>
                <h3 className="text-sm font-bold text-white mb-1">
                  {format(selectedDay, "d 'de' MMMM", { locale: es })}
                </h3>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-6">
                  {dayEvents.length} evento{dayEvents.length !== 1 ? 's' : ''}
                </p>
                <div className="space-y-3">
                  {dayEvents.map((ev, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${ev.color || (ev.type === 'INCOME' ? '#10B981' : '#F43F5E')}20` }}
                      >
                        {ev.type === 'INCOME'
                          ? <TrendingUp size={14} className="text-[#10B981]" />
                          : <TrendingDown size={14} className="text-rose-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{ev.name}</p>
                        <p className="text-[11px] text-gray-500 capitalize">{ev.type.toLowerCase()}</p>
                      </div>
                      <p className={cn(
                        'text-sm font-bold shrink-0',
                        ev.type === 'INCOME' ? 'text-[#10B981]' : 'text-rose-400'
                      )}>
                        {ev.type === 'INCOME' ? '+' : '-'}{formatCurrency(ev.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                <CalendarDays size={28} className="text-gray-600 mb-3" />
                <p className="text-sm text-gray-500">Selecciona un día con eventos</p>
                <p className="text-xs text-gray-600 mt-1">
                  Los puntos indican ingresos (verde) o gastos (rojo)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Sección 3: Próximos 30 días ─────────────────────────────────────── */}
        <div className="bg-[#121418] border border-white/5 rounded-[28px] overflow-hidden">
          <div className="px-8 py-6 border-b border-white/5">
            <h2 className="text-lg font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-white">
              Próximos 30 días
            </h2>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="px-8 py-10 text-center">
              <p className="text-sm text-gray-500">No hay eventos programados en los próximos 30 días</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {/* Encabezado */}
              <div className="grid grid-cols-4 px-8 py-3 bg-white/[0.02]">
                {['Fecha', 'Nombre', 'Tipo', 'Monto'].map((h) => (
                  <p key={h} className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{h}</p>
                ))}
              </div>
              {upcomingEvents.map((ev, i) => (
                <div key={i} className="grid grid-cols-4 px-8 py-4 hover:bg-white/[0.02] transition-colors items-center">
                  <p className="text-sm text-gray-400">
                    {format(ev.date, "d MMM", { locale: es })}
                  </p>
                  <p className="text-sm text-white font-medium truncate pr-4">{ev.name}</p>
                  <div>
                    <span className={cn(
                      'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xl',
                      ev.type === 'INCOME'
                        ? 'bg-[#10B981]/10 text-[#10B981]'
                        : 'bg-rose-500/10 text-rose-400'
                    )}>
                      {ev.type === 'INCOME' ? 'Ingreso' : 'Gasto'}
                    </span>
                  </div>
                  <p className={cn(
                    'text-sm font-bold',
                    ev.type === 'INCOME' ? 'text-[#10B981]' : 'text-rose-400'
                  )}>
                    {ev.type === 'INCOME' ? '+' : '-'}{formatCurrency(ev.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
