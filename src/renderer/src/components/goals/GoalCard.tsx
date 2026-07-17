import {
  Plane,
  Home,
  Shield,
  Monitor,
  GraduationCap,
  Bike,
  Target,
  PiggyBank,
  type LucideIcon
} from 'lucide-react'
import { format, differenceInMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatCurrency, cn } from '@/lib/utils'
import type { SavingsGoal, SavingsGoalPriority } from '../../../../shared/types'

const ICON_MAP: Record<string, LucideIcon> = {
  plane: Plane,
  home: Home,
  shield: Shield,
  monitor: Monitor,
  graduationcap: GraduationCap,
  bike: Bike,
  target: Target,
  piggybank: PiggyBank
}

const PRIORITY_BADGE: Record<SavingsGoalPriority, { label: string; classes: string }> = {
  HIGH: { label: 'Alta', classes: 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' },
  MEDIUM: { label: 'Media', classes: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
  LOW: { label: 'Baja', classes: 'bg-gray-500/10 text-gray-400 border border-gray-500/20' }
}

interface GoalCardProps {
  goal: SavingsGoal
  onEdit: (goal: SavingsGoal) => void
  onContribute: (goal: SavingsGoal) => void
}

export function GoalCard({ goal, onEdit, onContribute }: GoalCardProps): JSX.Element {
  const percentage = goal.targetAmount > 0
    ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
    : 0

  const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0)

  const now = new Date()
  const monthsRemaining = goal.deadline
    ? Math.max(differenceInMonths(goal.deadline, now), 0)
    : null

  const monthlyRecommended = monthsRemaining && monthsRemaining > 0 && remaining > 0
    ? Math.ceil(remaining / monthsRemaining)
    : null

  // SVG circle gauge
  const r = 40
  const circumference = 2 * Math.PI * r
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const iconKey = goal.icon?.toLowerCase().replace(/[^a-z]/g, '') ?? 'target'
  const IconComponent = ICON_MAP[iconKey] ?? Target
  const priority = PRIORITY_BADGE[goal.priority]

  return (
    <div
      className={cn(
        'bg-[#121418] border border-white/5 rounded-[28px] p-8 relative overflow-hidden',
        'hover:border-white/10 transition-all duration-200 group',
        'border-l-4'
      )}
      style={{ borderLeftColor: goal.color || '#10B981' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${goal.color || '#10B981'}20` }}
          >
            <IconComponent size={20} style={{ color: goal.color || '#10B981' }} />
          </div>
          <div>
            <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white text-base leading-tight">
              {goal.name}
            </h3>
            {goal.isCompleted && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#10B981]">
                Completada ✓
              </span>
            )}
          </div>
        </div>
        <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-xl', priority.classes)}>
          {priority.label}
        </span>
      </div>

      {/* Progress circular + amounts */}
      <div className="flex items-center gap-6 mb-6">
        {/* SVG gauge */}
        <div className="shrink-0 relative w-24 h-24 flex items-center justify-center">
          <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
            {/* Track */}
            <circle
              cx="48"
              cy="48"
              r={r}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="6"
            />
            {/* Progress */}
            <circle
              cx="48"
              cy="48"
              r={r}
              fill="none"
              stroke={goal.color || '#10B981'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-lg font-['Plus_Jakarta_Sans',sans-serif] font-bold"
              style={{ color: goal.color || '#10B981' }}
            >
              {Math.round(percentage)}%
            </span>
          </div>
        </div>

        {/* Amounts */}
        <div className="flex-1 space-y-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-0.5">
              Ahorrado
            </p>
            <p className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white">
              {formatCurrency(goal.currentAmount)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-0.5">
              Objetivo
            </p>
            <p className="text-sm text-gray-400">
              {formatCurrency(goal.targetAmount)}
            </p>
          </div>
          {remaining > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-0.5">
                Faltante
              </p>
              <p className="text-sm text-rose-400">
                {formatCurrency(remaining)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Deadline & monthly */}
      {(goal.deadline || monthlyRecommended) && (
        <div className="space-y-2 mb-6 pt-4 border-t border-white/5">
          {goal.deadline && (
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-gray-500">Fecha límite</span>
              <span className="text-[11px] font-medium text-gray-300">
                {format(goal.deadline, "d MMM yyyy", { locale: es })}
                {monthsRemaining !== null && (
                  <span className="ml-2 text-gray-500">
                    ({monthsRemaining} {monthsRemaining === 1 ? 'mes' : 'meses'})
                  </span>
                )}
              </span>
            </div>
          )}
          {monthlyRecommended && (
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-gray-500">Ahorro mensual sugerido</span>
              <span className="text-[11px] font-bold text-[#10B981]">
                {formatCurrency(monthlyRecommended)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {!goal.isCompleted && (
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <button
            onClick={() => onContribute(goal)}
            className="flex-1 h-9 rounded-2xl bg-[#10B981] text-black text-xs font-bold hover:bg-[#0ea371] transition-colors"
          >
            Agregar aporte
          </button>
          <button
            onClick={() => onEdit(goal)}
            className="h-9 px-4 rounded-2xl bg-white/5 text-gray-400 text-xs hover:bg-white/10 hover:text-white transition-colors"
          >
            Editar
          </button>
        </div>
      )}

      {goal.isCompleted && (
        <div className="flex gap-2">
          <div className="flex-1 h-9 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center">
            <span className="text-[#10B981] text-xs font-bold">¡Meta alcanzada! 🎉</span>
          </div>
        </div>
      )}
    </div>
  )
}
