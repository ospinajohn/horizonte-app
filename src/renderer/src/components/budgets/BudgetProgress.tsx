import { cn, formatCurrency } from '@/lib/utils'
import * as LucideIcons from 'lucide-react'

interface BudgetProgressProps {
  categoryName: string
  iconName: string
  color: string
  limit: number
  spent: number
  percentage: number
}

export function BudgetProgress({
  categoryName,
  iconName,
  color,
  limit,
  spent,
  percentage
}: BudgetProgressProps): JSX.Element {
  // @ts-ignore - LucideIcons acts as a map of components
  const IconComponent = LucideIcons[iconName] || LucideIcons.Tag

  // Lógica del semáforo
  let progressColorClass = 'bg-[#10B981] shadow-[0_0_10px_#10B981]' // Verde por defecto (< 70%)
  let textColorClass = 'text-[#10B981]'
  
  if (percentage >= 90) {
    progressColorClass = 'bg-rose-500 shadow-[0_0_10px_#F43F5E]'
    textColorClass = 'text-rose-500'
  } else if (percentage >= 70) {
    progressColorClass = 'bg-amber-500 shadow-[0_0_10px_#F59E0B]'
    textColorClass = 'text-amber-500'
  }

  const remaining = Math.max(limit - spent, 0)
  const isOverBudget = spent > limit

  return (
    <div className="bg-[#121418] border border-white/5 rounded-[28px] p-6 transition-all duration-200 hover:border-white/10">
      <div className="flex items-center gap-4 mb-4">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: color + '33', border: `1px solid ${color}40` }}
        >
          <IconComponent size={18} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-white truncate">{categoryName}</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {isOverBudget ? 'Excedido por ' : 'Disponible '}
            <span className={cn("font-bold", isOverBudget ? 'text-rose-400' : 'text-white')}>
              {formatCurrency(isOverBudget ? spent - limit : remaining)}
            </span>
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className={cn("text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold", textColorClass)}>
            {Math.round(percentage)}%
          </p>
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-1">
            DE {formatCurrency(limit)}
          </p>
        </div>
      </div>

      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", progressColorClass)}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}
