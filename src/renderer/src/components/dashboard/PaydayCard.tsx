import { CalendarDays, Info } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface PaydayCardProps {
  amount: number
  date: Date
  isPositiveCashflow: boolean
}

export function PaydayCard({ amount, date, isPositiveCashflow }: PaydayCardProps): JSX.Element {
  const dateLabel = format(date, "d 'de' MMMM", { locale: es })

  return (
    <div className="col-span-12 lg:col-span-4 bg-gradient-to-br from-[#121418] to-[#0A0B0E] border border-white/5 rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.2)] p-10 flex flex-col justify-between">

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
            Proyección Inmediata
          </p>
          <h3 className="text-xl font-bold">Próxima Quincena</h3>
        </div>
        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20 shrink-0">
          <CalendarDays size={22} />
        </div>
      </div>

      {/* Amount */}
      <div className="py-8">
        <h4 className="text-5xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-blue-400">
          +{formatCurrency(amount)}
        </h4>
        <p className="text-sm text-gray-500 mt-2">
          Programado para el{' '}
          <span className="text-gray-200 font-bold">{dateLabel}</span>
        </p>
      </div>

      {/* Info box */}
      <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-4 border border-white/5">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
          <Info size={16} />
        </div>
        <p className="text-xs text-gray-400 leading-snug">
          Tu flujo de caja será{' '}
          <span className="text-white font-bold">
            {isPositiveCashflow ? 'positivo' : 'ajustado'}
          </span>{' '}
          tras el pago de obligaciones.
        </p>
      </div>
    </div>
  )
}
