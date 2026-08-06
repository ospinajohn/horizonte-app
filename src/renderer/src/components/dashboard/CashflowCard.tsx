import { ArrowDownRight, ArrowUpRight, CalendarClock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { format, isAfter, addDays } from 'date-fns'
import { es } from 'date-fns/locale'

interface CashflowEvent {
  name: string
  amount: number
  type: string
  nextDate: Date | string
}

interface CashflowCardProps {
  events: CashflowEvent[]
}

export function CashflowCard({ events }: CashflowCardProps): JSX.Element {
  const now = new Date()
  const cutoff = addDays(now, 14)

  const upcoming = events
    .filter((e) => {
      const d = e.nextDate instanceof Date ? e.nextDate : new Date(e.nextDate)
      return isAfter(d, now) && !isAfter(d, cutoff)
    })
    .sort((a, b) => {
      const da = a.nextDate instanceof Date ? a.nextDate : new Date(a.nextDate)
      const db = b.nextDate instanceof Date ? b.nextDate : new Date(b.nextDate)
      return da.getTime() - db.getTime()
    })
    .slice(0, 5)

  const totalIn = upcoming
    .filter((e) => e.type === 'INCOME')
    .reduce((sum, e) => sum + e.amount, 0)
  const totalOut = upcoming
    .filter((e) => e.type !== 'INCOME')
    .reduce((sum, e) => sum + e.amount, 0)
  const net = totalIn - totalOut

  return (
    <div className="col-span-12 lg:col-span-4 bg-[#121418] border border-white/5 rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.2)] p-10 flex flex-col justify-between min-h-[300px]">

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
            Flujo Próximo
          </p>
          <h3 className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold">
            Próximos 14 días
          </h3>
        </div>
        <div className="w-12 h-12 bg-[#10B981]/10 rounded-2xl flex items-center justify-center text-[#10B981] border border-[#10B981]/20 shrink-0">
          <CalendarClock size={22} />
        </div>
      </div>

      {/* Events list */}
      {upcoming.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-600 text-center">
            Sin movimientos programados en los próximos 14 días
          </p>
        </div>
      ) : (
        <div className="space-y-4 flex-1">
          {upcoming.map((event, i) => {
            const d = event.nextDate instanceof Date ? event.nextDate : new Date(event.nextDate)
            const isIncome = event.type === 'INCOME'
            return (
              <div key={i} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isIncome
                    ? 'bg-[#10B981]/10 text-[#10B981]'
                    : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {isIncome ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-300 truncate">{event.name}</p>
                  <p className="text-[10px] text-gray-600 font-['JetBrains_Mono',monospace]">
                    {format(d, 'EEE d', { locale: es })}
                  </p>
                </div>
                <span className={`text-sm font-bold font-['Plus_Jakarta_Sans',sans-serif] ${
                  isIncome ? 'text-[#10B981]' : 'text-rose-500'
                }`}>
                  {isIncome ? '+' : '-'}{formatCurrency(event.amount)}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Net balance */}
      {upcoming.length > 0 && (
        <div className="mt-6 pt-6 border-t border-white/5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Saldo Neto Esperado
            </span>
            <span className={`text-xl font-bold font-['Plus_Jakarta_Sans',sans-serif] ${
              net >= 0 ? 'text-[#10B981]' : 'text-rose-500'
            }`}>
              {net >= 0 ? '+' : ''}{formatCurrency(net)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
