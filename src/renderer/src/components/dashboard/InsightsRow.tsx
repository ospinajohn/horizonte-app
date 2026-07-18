import { formatCurrency, formatPercent } from '@/lib/utils'
import { TrendingUp, ShoppingCart, CalendarClock } from 'lucide-react'

interface InsightsRowProps {
  monthIncome: number
  monthExpense: number
  topCategory: { name: string; amount: number } | null
  daysUntilPayday: number
}

export function InsightsRow({
  monthIncome,
  monthExpense,
  topCategory,
  daysUntilPayday
}: InsightsRowProps): JSX.Element {
  const savingsRate = monthIncome > 0
    ? ((monthIncome - monthExpense) / monthIncome) * 100
    : 0

  const savingsColor = savingsRate >= 20
    ? 'text-[#10B981]'
    : savingsRate >= 0
      ? 'text-amber-400'
      : 'text-rose-500'

  const paydayColor = daysUntilPayday > 7
    ? 'text-[#10B981]'
    : daysUntilPayday > 0
      ? 'text-amber-400'
      : 'text-rose-500'

  return (
    <div className="col-span-12 lg:col-span-6 bg-[#121418] border border-white/5 rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.2)] p-10 flex flex-col justify-between">
      {/* Header */}
      <div className="mb-8">
        <h4 className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold">
          Indicadores Clave
        </h4>
        <p className="text-xs text-gray-500 mt-1">Resumen rápido de tu posición financiera</p>
      </div>

      {/* Metrics — vertical stack */}
      <div className="space-y-6">
        {/* Tasa de Ahorro */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 flex items-center justify-center shrink-0">
            <TrendingUp size={16} className="text-[#10B981]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
              Tasa de Ahorro
            </p>
            <p className={`text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold ${savingsColor}`}>
              {formatPercent(savingsRate, 1)}
            </p>
          </div>
        </div>

        <div className="h-px bg-white/5" />

        {/* Top Gasto */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
            <ShoppingCart size={16} className="text-rose-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
              Top Gasto
            </p>
            {topCategory ? (
              <div>
                <p className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-rose-500">
                  {formatCurrency(topCategory.amount)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{topCategory.name}</p>
              </div>
            ) : (
              <p className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-gray-600">
                —
              </p>
            )}
          </div>
        </div>

        <div className="h-px bg-white/5" />

        {/* Días al Pago */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
            <CalendarClock size={16} className="text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
              Días al Pago
            </p>
            <p className={`text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold ${paydayColor}`}>
              {daysUntilPayday}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
