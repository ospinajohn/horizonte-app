import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface Goal {
  id: number
  name: string
  percentage: number
  variant?: 'emerald' | 'blue' | 'amber' | 'rose'
}

interface GoalsCardProps {
  goals: Goal[]
  onViewAll?: () => void
}

const percentageColors: Record<string, string> = {
  emerald: 'text-[#10B981]',
  blue: 'text-blue-400',
  amber: 'text-amber-400',
  rose: 'text-rose-400'
}

export function GoalsCard({
  goals,
  onViewAll
}: GoalsCardProps): JSX.Element {
  return (
    <div className="col-span-12 lg:col-span-6 bg-[#121418] border border-white/5 rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.2)] p-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <h4 className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold">
          Metas de Ahorro
        </h4>
        <button
          onClick={onViewAll}
          className="text-xs font-bold text-[#10B981] hover:underline"
        >
          Ver todas
        </button>
      </div>

      {/* Goals list */}
      <div className="space-y-8">
        {goals.map((goal) => {
          const variant = goal.variant ?? 'emerald'
          const colorClass = percentageColors[variant] ?? 'text-[#10B981]'

          return (
            <div key={goal.id}>
              <div className="flex justify-between mb-3 text-sm">
                <span className="font-medium text-gray-300 italic">{goal.name}</span>
                <span className={cn('font-bold', colorClass)}>
                  {goal.percentage}%
                </span>
              </div>
              <Progress
                value={goal.percentage}
                variant={variant}
                glow={variant === 'emerald'}
              />
            </div>
          )
        })}

        {goals.length === 0 && (
          <p className="text-sm text-gray-600 text-center py-4">
            No hay metas activas
          </p>
        )}
      </div>
    </div>
  )
}
