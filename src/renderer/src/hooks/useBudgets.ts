import { useState, useEffect, useCallback } from 'react'
import type { Budget, BudgetCategory, CreateBudgetDto, ApiResult } from '../../../shared/types'

export type ActiveBudgetWithSpending = Budget & {
  categories: Array<BudgetCategory & { spent: number; remaining: number; percentage: number }>
}

interface UseBudgetsReturn {
  activeBudget: ActiveBudgetWithSpending | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useBudgets(): UseBudgetsReturn {
  const [activeBudget, setActiveBudget] = useState<ActiveBudgetWithSpending | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActiveBudget = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result: ApiResult<ActiveBudgetWithSpending | null> = await window.api.budgets.getActiveWithSpending()
      if (result.success) {
        setActiveBudget(result.data ?? null)
      } else {
        setError(result.error ?? 'Error al cargar el presupuesto')
      }
    } catch (e) {
      setError('Error inesperado al cargar el presupuesto')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActiveBudget()
  }, [fetchActiveBudget])

  return { activeBudget, loading, error, refetch: fetchActiveBudget }
}
