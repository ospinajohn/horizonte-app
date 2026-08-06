import type { CardIntelligence } from '../../../../shared/types'

interface CreditCardsInsightCardProps {
  intelligence: CardIntelligence[]
  onViewAll?: () => void
}

export function CreditCardsInsightCard({ intelligence, onViewAll }: CreditCardsInsightCardProps): JSX.Element | null {
  if (intelligence.length === 0) return null

  const bestToday = [...intelligence].sort(
    (a, b) => b.financingDaysIfPurchaseToday - a.financingDaysIfPurchaseToday
  )[0]

  const nextBestMoment = [...intelligence]
    .filter((c) => c.status !== 'EXCELLENT')
    .sort((a, b) => a.daysUntilCut - b.daysUntilCut)[0]

  const nextPayment = [...intelligence].sort((a, b) => a.daysUntilPayment - b.daysUntilPayment)[0]

  return (
    <div className="col-span-12 bg-[#121418] border border-white/5 rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.2)] p-10">
      <div className="flex justify-between items-center mb-8">
        <h4 className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold">
          Tarjetas de Crédito
        </h4>
        <button onClick={onViewAll} className="text-xs font-bold text-[#10B981] hover:underline">
          Ver tarjetas
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Mayor ventaja hoy</p>
          <p className="text-lg font-bold text-white">{bestToday.name}</p>
          <p className="text-sm text-[#10B981]">{bestToday.financingDaysIfPurchaseToday} días para pagar</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Próxima en su mejor momento</p>
          {nextBestMoment ? (
            <>
              <p className="text-lg font-bold text-white">{nextBestMoment.name}</p>
              <p className="text-sm text-blue-400">
                {nextBestMoment.daysUntilCut === 0 ? 'Hoy' : `En ${nextBestMoment.daysUntilCut} día${nextBestMoment.daysUntilCut === 1 ? '' : 's'}`}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-600">Todas están en su mejor momento</p>
          )}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Próximo pago</p>
          <p className="text-lg font-bold text-white">{nextPayment.name}</p>
          <p className="text-sm text-amber-400">
            {nextPayment.daysUntilPayment === 0 ? 'Hoy' : `En ${nextPayment.daysUntilPayment} día${nextPayment.daysUntilPayment === 1 ? '' : 's'}`}
          </p>
        </div>
      </div>
    </div>
  )
}
