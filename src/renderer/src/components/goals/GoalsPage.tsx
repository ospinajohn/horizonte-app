import { useState } from 'react'
import { Target, Plus } from 'lucide-react'
import { useGoals } from '@/hooks/useGoals'
import { formatCurrency } from '@/lib/utils'
import { GoalCard } from './GoalCard'
import { GoalFormModal } from './GoalFormModal'
import { ContributionModal } from './ContributionModal'
import type { SavingsGoal } from '../../../../shared/types'

function GoalSkeleton(): JSX.Element {
  return (
    <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8 animate-pulse">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/5" />
          <div className="h-5 w-32 rounded-xl bg-white/5" />
        </div>
        <div className="h-5 w-16 rounded-xl bg-white/5" />
      </div>
      <div className="flex items-center gap-6 mb-6">
        <div className="w-24 h-24 rounded-full bg-white/5 shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-24 rounded bg-white/5" />
          <div className="h-6 w-36 rounded bg-white/5" />
          <div className="h-4 w-20 rounded bg-white/5" />
        </div>
      </div>
    </div>
  )
}

export function GoalsPage(): JSX.Element {
  const { goals, loading, refetch } = useGoals()
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null)
  const [contributionGoal, setContributionGoal] = useState<SavingsGoal | null>(null)
  const [contributionOpen, setContributionOpen] = useState(false)

  const activeGoals = goals.filter((g) => !g.isCompleted)
  const completedGoals = goals.filter((g) => g.isCompleted)

  const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0)
  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0)
  const overallPercentage = totalTarget > 0
    ? Math.min((totalSaved / totalTarget) * 100, 100)
    : 0

  const handleEdit = (goal: SavingsGoal): void => {
    setEditingGoal(goal)
    setFormModalOpen(true)
  }

  const handleContribute = (goal: SavingsGoal): void => {
    setContributionGoal(goal)
    setContributionOpen(true)
  }

  const handleFormClose = (): void => {
    setFormModalOpen(false)
    setEditingGoal(null)
  }

  const handleContributionClose = (): void => {
    setContributionOpen(false)
    setContributionGoal(null)
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-12 py-8 shrink-0 flex items-end justify-between border-b border-white/5 bg-[#08090B]/80 backdrop-blur-md sticky top-0 z-10">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#10B981] mb-2">
            // Ahorro
          </p>
          <h1 className="text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-white tracking-tight">
            Metas de Ahorro
          </h1>
        </div>
        <button
          onClick={() => { setEditingGoal(null); setFormModalOpen(true) }}
          className="flex items-center gap-2 h-10 px-5 rounded-2xl bg-[#10B981] text-black font-bold text-sm hover:bg-[#0ea371] transition-colors shadow-lg shadow-[#10B981]/20"
        >
          <Plus size={16} />
          Nueva Meta
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-12 py-8 custom-scrollbar">
        {/* Resumen global */}
        {goals.length > 0 && (
          <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8 mb-10 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#10B981]/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="relative flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Total Ahorrado
                </p>
                <p className="text-5xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-white tracking-tight mb-2">
                  {formatCurrency(totalSaved)}
                </p>
                <p className="text-sm text-gray-500">
                  de{' '}
                  <span className="text-gray-300 font-semibold">{formatCurrency(totalTarget)}</span>
                  {' '}en objetivo total
                </p>
              </div>

              <div className="shrink-0 w-full md:w-72">
                <div className="flex justify-between items-end mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Progreso global
                  </p>
                  <p className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[#10B981]">
                    {Math.round(overallPercentage)}%
                  </p>
                </div>
                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full rounded-full bg-[#10B981] shadow-[0_0_10px_#10B981] transition-all duration-1000"
                    style={{ width: `${overallPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-gray-600">{activeGoals.length} activas</span>
                  <span className="text-[10px] text-[#10B981]">{completedGoals.length} completadas</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estado de carga */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <GoalSkeleton key={i} />)}
          </div>
        )}

        {/* Estado vacío */}
        {!loading && goals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-[#10B981]/10 rounded-full flex items-center justify-center mb-6 border border-[#10B981]/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
              <Target size={32} className="text-[#10B981]" />
            </div>
            <h2 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white mb-2">
              Sin metas de ahorro
            </h2>
            <p className="text-sm text-gray-500 max-w-md mb-8 leading-relaxed">
              Define tus objetivos financieros y lleva un seguimiento del progreso. Desde un viaje hasta un fondo de emergencia, cada meta te acerca a tu independencia financiera.
            </p>
            <button
              onClick={() => setFormModalOpen(true)}
              className="flex items-center gap-2 h-11 px-6 rounded-2xl bg-[#10B981] text-black font-bold text-sm hover:bg-[#0ea371] transition-colors shadow-lg shadow-[#10B981]/20"
            >
              <Plus size={16} />
              Crear primera meta
            </button>
          </div>
        )}

        {/* Metas activas */}
        {!loading && activeGoals.length > 0 && (
          <div className="mb-10">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6">
              Metas activas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={handleEdit}
                  onContribute={handleContribute}
                />
              ))}
            </div>
          </div>
        )}

        {/* Metas completadas */}
        {!loading && completedGoals.length > 0 && (
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6">
              Metas completadas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={handleEdit}
                  onContribute={handleContribute}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      <GoalFormModal
        open={formModalOpen}
        onClose={handleFormClose}
        onSuccess={() => { handleFormClose(); refetch() }}
        goal={editingGoal}
      />
      <ContributionModal
        open={contributionOpen}
        onClose={handleContributionClose}
        onSuccess={() => { handleContributionClose(); refetch() }}
        goal={contributionGoal}
      />
    </div>
  )
}
