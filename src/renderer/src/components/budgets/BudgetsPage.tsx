import { useBudgets } from '../../hooks/useBudgets'
import { useAppStore } from '../../store/useAppStore'
import { Plus, BarChart3, TrendingDown } from 'lucide-react'
import { Button } from '../ui/button'
import { formatCurrency, cn } from '@/lib/utils'
import { BudgetProgress } from './BudgetProgress'
import { BudgetFormModal } from './BudgetFormModal'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function BudgetsPage(): JSX.Element {
  const { activeBudget, loading, refetch } = useBudgets()
  const { setActiveModal } = useAppStore()

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-white/5 mb-4" />
          <div className="h-4 w-32 bg-white/5 rounded" />
        </div>
      </div>
    )
  }

  // Si no hay presupuesto activo
  if (!activeBudget) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="w-20 h-20 bg-[#10B981]/10 rounded-full flex items-center justify-center mb-6 border border-[#10B981]/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
          <BarChart3 size={32} className="text-[#10B981]" />
        </div>
        <h2 className="text-3xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-white mb-2">
          Sin presupuesto activo
        </h2>
        <p className="text-sm text-gray-500 max-w-md mb-8 leading-relaxed">
          Crea un presupuesto para establecer límites de gasto por categoría y recibir alertas antes de excederte. Mantén el control de tus finanzas.
        </p>
        <Button onClick={() => setActiveModal({ type: 'create-budget' })} size="lg" className="px-8 shadow-lg shadow-[#10B981]/20">
          <Plus size={18} className="mr-2" />
          Crear Presupuesto
        </Button>
        <BudgetFormModal onSuccess={refetch} />
      </div>
    )
  }

  // Cálculos globales
  const totalLimit = activeBudget.categories.reduce((acc, cat) => acc + cat.limit, 0)
  const totalSpent = activeBudget.categories.reduce((acc, cat) => acc + cat.spent, 0)
  const totalRemaining = Math.max(totalLimit - totalSpent, 0)
  const totalPercentage = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0
  const isOverBudget = totalSpent > totalLimit

  let statusColor = 'text-[#10B981]'
  if (totalPercentage >= 90) statusColor = 'text-rose-500'
  else if (totalPercentage >= 70) statusColor = 'text-amber-500'

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header Fijo */}
      <div className="px-12 py-8 shrink-0 flex items-end justify-between border-b border-white/5 bg-[#08090B]/80 backdrop-blur-md sticky top-0 z-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#10B981]">
              // {activeBudget.name}
            </p>
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold uppercase tracking-wider text-gray-400">
              {format(new Date(activeBudget.startDate), 'MMM d', { locale: es })} - {format(new Date(activeBudget.endDate), 'MMM d', { locale: es })}
            </span>
          </div>
          <h1 className="text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-white tracking-tight flex items-center gap-3">
            Presupuesto
            {totalPercentage >= 80 && (
              <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1.5 translate-y-1">
                <TrendingDown size={14} /> Atención requerida
              </span>
            )}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={async () => {
             // Lógica de borrar o crear nuevo
             await window.api.budgets.delete(activeBudget.id)
             refetch()
          }}>
            <span className="text-rose-500">Terminar Presupuesto</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-12 py-8 custom-scrollbar">
        {/* Resumen Global */}
        <div className="bg-[#121418] border border-white/5 rounded-[32px] p-10 mb-12 shadow-2xl relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#10B981]/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">Total Gastado</p>
              <div className="flex items-baseline gap-4 mb-2">
                <p className="text-5xl md:text-[4rem] font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-white tracking-tight leading-none">
                  <span className="text-gray-600 font-light text-4xl mr-1">$</span>
                  {totalSpent.toLocaleString('es-CO')}
                </p>
              </div>
              <p className="text-sm text-gray-400">
                {isOverBudget ? 'Has excedido el total por ' : 'Te quedan '}
                <span className={cn("font-bold", isOverBudget ? 'text-rose-400' : 'text-white')}>
                  {formatCurrency(isOverBudget ? totalSpent - totalLimit : totalRemaining)}
                </span>
                {' '}para terminar el período
              </p>
            </div>

            <div className="w-full md:w-64 shrink-0 text-right">
              <div className="flex justify-between items-end mb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Consumo Total</p>
                <p className={cn("text-3xl font-['Plus_Jakarta_Sans',sans-serif] font-bold leading-none", statusColor)}>
                  {Math.round(totalPercentage)}%
                </p>
              </div>
              <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden shadow-inner mb-2 border border-white/5">
                <div
                  className={cn("h-full rounded-full transition-all duration-1000", 
                    totalPercentage >= 90 ? 'bg-rose-500 shadow-[0_0_10px_#F43F5E]' : 
                    totalPercentage >= 70 ? 'bg-amber-500 shadow-[0_0_10px_#F59E0B]' : 
                    'bg-[#10B981] shadow-[0_0_10px_#10B981]')}
                  style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                LÍMITE TOTAL: {formatCurrency(totalLimit)}
              </p>
            </div>
          </div>
        </div>

        {/* Categorías Grid */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-6">Desglose por Categoría</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeBudget.categories.map((cat) => (
              <BudgetProgress
                key={cat.id}
                categoryName={cat.category?.name ?? 'Desconocida'}
                iconName={cat.category?.icon ?? 'Tag'}
                color={cat.category?.color ?? '#6b7280'}
                limit={cat.limit}
                spent={cat.spent}
                percentage={cat.percentage}
              />
            ))}
          </div>
        </div>
      </div>

      <BudgetFormModal onSuccess={refetch} />
    </div>
  )
}
