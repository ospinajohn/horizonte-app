import { getPrismaClient } from '../database/client'
import { startOfMonth, endOfMonth } from 'date-fns'
import type { Budget, BudgetCategory, CreateBudgetDto, ApiResult } from '../../shared/types'

const db = () => getPrismaClient()

export const BudgetService = {
  async getAll(): Promise<ApiResult<Budget[]>> {
    try {
      const budgets = await db().budget.findMany({
        include: { categories: { include: { category: true } } },
        orderBy: { startDate: 'desc' }
      })
      return { success: true, data: budgets as Budget[] }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async getActive(): Promise<ApiResult<Budget | null>> {
    try {
      const today = new Date()
      const budget = await db().budget.findFirst({
        where: {
          isActive: true,
          startDate: { lte: today },
          endDate: { gte: today }
        },
        include: { categories: { include: { category: true } } }
      })
      return { success: true, data: budget as Budget | null }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async create(dto: CreateBudgetDto): Promise<ApiResult<Budget>> {
    try {
      const budget = await db().budget.create({
        data: {
          name: dto.name,
          period: dto.period,
          startDate: dto.startDate,
          endDate: dto.endDate,
          categories: {
            create: dto.categories.map((c) => ({
              categoryId: c.categoryId,
              limit: c.limit
            }))
          }
        },
        include: { categories: { include: { category: true } } }
      })
      return { success: true, data: budget as Budget }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  async delete(id: number): Promise<ApiResult<void>> {
    try {
      await db().budget.update({ where: { id }, data: { isActive: false } })
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  /** Calcula el gasto real de cada categoría en el período del presupuesto */
  async getWithSpending(budgetId: number): Promise<ApiResult<Budget & {
    categories: Array<BudgetCategory & { spent: number; remaining: number; percentage: number }>
  }>> {
    try {
      const budget = await db().budget.findUnique({
        where: { id: budgetId },
        include: { categories: { include: { category: true } } }
      })
      if (!budget) return { success: false, error: 'Presupuesto no encontrado' }

      const categoriesWithSpending = await Promise.all(
        budget.categories.map(async (bc) => {
          const agg = await db().transaction.aggregate({
            where: {
              type: 'EXPENSE',
              categoryId: bc.categoryId,
              date: { gte: budget.startDate, lte: budget.endDate }
            },
            _sum: { amount: true }
          })
          const spent = agg._sum.amount ?? 0
          const remaining = Math.max(bc.limit - spent, 0)
          const percentage = bc.limit > 0 ? Math.min((spent / bc.limit) * 100, 100) : 0
          return { ...bc, spent, remaining, percentage }
        })
      )

      return {
        success: true,
        data: { ...budget, categories: categoriesWithSpending } as any
      }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  },

  /** Presupuesto activo con gasto real incluido */
  async getActiveWithSpending(): Promise<ApiResult<any>> {
    try {
      const active = await BudgetService.getActive()
      if (!active.success || !active.data) return { success: true, data: null }
      return BudgetService.getWithSpending(active.data.id)
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }
}
