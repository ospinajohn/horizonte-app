import { formatCurrency, formatPercent } from '@/lib/utils'

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
    <div className="col-span-12 grid grid-cols-3 gap-6">
      {/* ── Tasa de Ahorro ──────────────────────────────────────────────── */}
      <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">
          Tasa de Ahorro
        </p>
        <p className={`text-3xl font-['Plus_Jakarta_Sans',sans-serif] font-bold ${savingsColor}`}>
          {formatPercent(savingsRate, 1)}
        </p>
      </div>

      {/* ── Top Gasto ───────────────────────────────────────────────────── */}
      <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">
          Top Gasto
        </p>
        {topCategory ? (
          <>
            <p className="text-3xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-rose-500">
              {formatCurrency(topCategory.amount)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{topCategory.name}</p>
          </>
        ) : (
          <p className="text-3xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-gray-600">
            —
          </p>
        )}
      </div>

      {/* ── Días al Pago ────────────────────────────────────────────────── */}
      <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">
          Días al Pago
        </p>
        <p className={`text-3xl font-['Plus_Jakarta_Sans',sans-serif] font-bold ${paydayColor}`}>
          {daysUntilPayday}
        </p>
      </div>
    </div>
  )
}
