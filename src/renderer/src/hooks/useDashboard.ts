import { useState, useEffect, useCallback } from 'react'
import type { DashboardData, ApiResult } from '../../../shared/types'

interface UseDashboardReturn {
  data: DashboardData | null
  loading: boolean
  refetch: () => void
}

export function useDashboard(): UseDashboardReturn {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(() => {
    setLoading(true)
    window.api.dashboard.getData().then((result: ApiResult<DashboardData>) => {
      if (result.success && result.data) {
        setData(result.data)
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, refetch: fetchData }
}
