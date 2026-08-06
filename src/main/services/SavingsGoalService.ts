import { getPrismaClient } from '../database/client'
import { wrapService } from '../lib/wrapService'
import { differenceInMonths, addMonths } from 'date-fns'
import {
  createSavingsGoalSchema,
  updateSavingsGoalSchema,
  createSavingsContributionSchema,
  validateDto
} from '../../shared/validation'
import type {
  SavingsGoal,
  SavingsContribution,
  CreateSavingsGoalDto,
  CreateSavingsContributionDto,
  ApiResult
} from '../../shared/types'

const db = () => getPrismaClient()

export const SavingsGoalService = {
  async getAll(): Promise<ApiResult<SavingsGoal[]>> {
    return wrapService(async () => {
      const goals = await db().savingsGoal.findMany({
        where: { isActive: true },
        include: { account: true, contributions: { orderBy: { date: 'desc' }, take: 5 } },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }]
      })
      return goals as SavingsGoal[]
    })
  },

  async getById(id: number): Promise<ApiResult<SavingsGoal>> {
    return wrapService(async () => {
      const goal = await db().savingsGoal.findUnique({
        where: { id },
        include: { account: true, contributions: { orderBy: { date: 'desc' } } }
      })
      if (!goal) throw new Error('Meta no encontrada')
      return goal as SavingsGoal
    })
  },

  async create(dto: CreateSavingsGoalDto): Promise<ApiResult<SavingsGoal>> {
    return wrapService(async () => {
      const data = validateDto(createSavingsGoalSchema, dto)
      const goal = await db().savingsGoal.create({
        data,
        include: { account: true }
      })
      return goal as SavingsGoal
    })
  },

  async update(id: number, dto: Partial<CreateSavingsGoalDto>): Promise<ApiResult<SavingsGoal>> {
    return wrapService(async () => {
      const data = validateDto(updateSavingsGoalSchema, dto)
      const goal = await db().savingsGoal.update({
        where: { id },
        data,
        include: { account: true }
      })
      return goal as SavingsGoal
    })
  },

  async delete(id: number): Promise<ApiResult<void>> {
    return wrapService(async () => {
      await db().savingsGoal.update({ where: { id }, data: { isActive: false } })
    })
  },

  async addContribution(dto: CreateSavingsContributionDto): Promise<ApiResult<SavingsContribution>> {
    return wrapService(async () => {
      const data = validateDto(createSavingsContributionSchema, dto)
      const [contribution] = await db().$transaction(async (tx) => {
        const contrib = await tx.savingsContribution.create({ data })
        // Actualizar currentAmount en la meta
        await tx.savingsGoal.update({
          where: { id: data.goalId },
          data: { currentAmount: { increment: data.amount } }
        })
        // Marcar como completada si alcanzó el objetivo
        const goal = await tx.savingsGoal.findUnique({ where: { id: data.goalId } })
        if (goal && goal.currentAmount >= goal.targetAmount) {
          await tx.savingsGoal.update({ where: { id: data.goalId }, data: { isCompleted: true } })
        }
        return [contrib]
      })
      return contribution as SavingsContribution
    })
  },

  /**
   * Calcula métricas derivadas para una meta:
   * - monthsRemaining, monthlyRecommended, estimatedCompletion
   */
  getMetrics(goal: SavingsGoal): {
    percentage: number
    remaining: number
    monthsRemaining: number | null
    monthlyRecommended: number | null
    estimatedCompletion: Date | null
  } {
    const percentage =
      goal.targetAmount > 0
        ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
        : 0
    const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0)

    let monthsRemaining: number | null = null
    let monthlyRecommended: number | null = null
    let estimatedCompletion: Date | null = null

    if (goal.deadline) {
      const deadline = new Date(goal.deadline)
      const now = new Date()
      monthsRemaining = Math.max(differenceInMonths(deadline, now), 0)
      if (monthsRemaining > 0 && remaining > 0) {
        monthlyRecommended = Math.ceil(remaining / monthsRemaining)
      }
    }

    if (goal.monthlyTarget && goal.monthlyTarget > 0 && remaining > 0) {
      const monthsNeeded = Math.ceil(remaining / goal.monthlyTarget)
      estimatedCompletion = addMonths(new Date(), monthsNeeded)
    }

    return { percentage, remaining, monthsRemaining, monthlyRecommended, estimatedCompletion }
  }
}
