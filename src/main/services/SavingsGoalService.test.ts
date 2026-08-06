import { describe, it, expect } from 'vitest'
import { SavingsGoalService } from './SavingsGoalService'
import type { SavingsGoal } from '../../shared/types'

function makeGoal(overrides: Partial<SavingsGoal> = {}): SavingsGoal {
  return {
    id: 1,
    name: 'Fondo viaje',
    targetAmount: 1_000_000,
    currentAmount: 0,
    deadline: null,
    priority: 'MEDIUM',
    icon: 'target',
    color: '#10B981',
    monthlyTarget: null,
    accountId: null,
    isActive: true,
    isCompleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  } as SavingsGoal
}

describe('SavingsGoalService.getMetrics', () => {
  it('calcula el porcentaje de avance correctamente', () => {
    const metrics = SavingsGoalService.getMetrics(makeGoal({ currentAmount: 250_000, targetAmount: 1_000_000 }))
    expect(metrics.percentage).toBe(25)
    expect(metrics.remaining).toBe(750_000)
  })

  it('no supera el 100% aunque currentAmount exceda el objetivo', () => {
    const metrics = SavingsGoalService.getMetrics(makeGoal({ currentAmount: 1_200_000, targetAmount: 1_000_000 }))
    expect(metrics.percentage).toBe(100)
    expect(metrics.remaining).toBe(0)
  })

  it('calcula meses restantes y aporte mensual recomendado con fecha límite', () => {
    const deadline = new Date()
    deadline.setMonth(deadline.getMonth() + 10)

    const metrics = SavingsGoalService.getMetrics(
      makeGoal({ currentAmount: 0, targetAmount: 1_000_000, deadline })
    )

    expect(metrics.monthsRemaining).toBeGreaterThanOrEqual(9)
    expect(metrics.monthlyRecommended).not.toBeNull()
    expect(metrics.monthlyRecommended!).toBeGreaterThan(0)
  })

  it('sin fecha límite ni monthlyTarget no calcula proyecciones', () => {
    const metrics = SavingsGoalService.getMetrics(makeGoal({ currentAmount: 0, targetAmount: 1_000_000 }))
    expect(metrics.monthsRemaining).toBeNull()
    expect(metrics.monthlyRecommended).toBeNull()
    expect(metrics.estimatedCompletion).toBeNull()
  })

  it('con monthlyTarget estima una fecha de finalización', () => {
    const metrics = SavingsGoalService.getMetrics(
      makeGoal({ currentAmount: 0, targetAmount: 600_000, monthlyTarget: 100_000 })
    )
    expect(metrics.estimatedCompletion).not.toBeNull()
  })
})
