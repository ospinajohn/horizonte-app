import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { useCountUp } from '@/hooks/useCountUp'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface LiquidityCardProps {
  totalBalance: number
  monthIncome: number
  monthExpense: number
  totalDebt: number
  prevMonthIncome: number
  prevMonthExpense: number
}

export function LiquidityCard({
  totalBalance,
  monthIncome,
  monthExpense,
  totalDebt,
  prevMonthIncome,
  prevMonthExpense
}: LiquidityCardProps): JSX.Element {
  const animatedBalance = useCountUp({ end: totalBalance, duration: 2500 })

  const incomeGrowth =
    prevMonthIncome > 0
      ? ((monthIncome - prevMonthIncome) / prevMonthIncome) * 100
      : 0

  const isPositiveGrowth = incomeGrowth >= 0

  // Formatear el balance animado separando enteros y decimales
  const formattedBalance = Math.floor(animatedBalance).toLocaleString('es-CO')

  return (
    <div className="col-span-12 lg:col-span-8 bg-[#121418] border border-white/5 rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.2)] p-10 flex flex-col justify-between min-h-[300px] relative overflow-hidden group">

      {/* Glow decorativo */}
      <div className="absolute -right-20 -top-20 w-96 h-96 bg-[#10B981] opacity-5 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-start relative z-10">
        <div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-3">
            <Wallet size={14} />
            Liquidez Total Disponible
          </span>

          <div className="flex items-baseline gap-4 mt-6">
            <span className="text-4xl text-gray-600 font-light font-['Plus_Jakarta_Sans',sans-serif]">
              $
            </span>
            <h2 className="text-8xl font-['Plus_Jakarta_Sans',sans-serif] font-bold tracking-tighter leading-none">
              {formattedBalance}
            </h2>
          </div>
        </div>

        {/* Badge de crecimiento */}
        <div className="text-right">
          <div
            className={cn(
              'px-4 py-2 rounded-2xl border inline-flex items-center gap-2',
              isPositiveGrowth
                ? 'bg-emerald-500/10 text-[#10B981] border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            )}
          >
            {isPositiveGrowth ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span className="font-bold text-sm">
              {isPositiveGrowth ? '+' : ''}
              {incomeGrowth.toFixed(1)}%
            </span>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-wider">
            vs Mes Anterior
          </p>
        </div>
      </div>

      {/* Stats footer */}
      <div className="flex items-center gap-12 mt-12 border-t border-white/5 pt-10 relative z-10">
        <div>
          <p className="text-[10px] text-gray-600 uppercase font-bold tracking-wider mb-2">
            Ingresos Mes
          </p>
          <p className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-gray-200">
            {formatCurrency(monthIncome)}
          </p>
        </div>

        <div className="h-10 w-px bg-white/5" />

        <div>
          <p className="text-[10px] text-gray-600 uppercase font-bold tracking-wider mb-2">
            Gastos Mes
          </p>
          <p className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-gray-200">
            {formatCurrency(monthExpense)}
          </p>
        </div>

        <div className="h-10 w-px bg-white/5" />

        <div>
          <p className="text-[10px] text-gray-600 uppercase font-bold tracking-wider mb-2">
            Deuda Total
          </p>
          <p className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-rose-500">
            {formatCurrency(totalDebt)}
          </p>
        </div>
      </div>
    </div>
  )
}
