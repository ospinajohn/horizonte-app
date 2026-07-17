import { useState, useEffect, useCallback } from 'react'
import type { SavingsGoal, ApiResult } from '../../../shared/types'

interface UseGoalsReturn {
  goals: SavingsGoal[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useGoals(): UseGoalsReturn {
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGoals = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result: ApiResult<SavingsGoal[]> = await window.api.goals.getAll()
      if (result.success && result.data) {
        // Fechas vienen como string desde IPC — convertir a Date
        const goals = result.data.map((g) => ({
          ...g,
          deadline: g.deadline ? new Date(g.deadline) : null,
          createdAt: new Date(g.createdAt),
          updatedAt: new Date(g.updatedAt),
          contributions: g.contributions?.map((c) => ({
            ...c,
            date: new Date(c.date),
            createdAt: new Date(c.createdAt)
          }))
        }))
        setGoals(goals)
      } else {
        setError(result.error ?? 'Error al cargar las metas')
      }
    } catch {
      setError('Error inesperado al cargar las metas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  return { goals, loading, error, refetch: fetchGoals }
}
