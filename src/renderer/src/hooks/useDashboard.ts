import { useState, useEffect } from 'react'
import type { DashboardData, ApiResult } from '../../../shared/types'

interface UseDashboardReturn {
  data: DashboardData | null
  loading: boolean
}

export function useDashboard(): UseDashboardReturn {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.dashboard.getData().then((result: ApiResult<DashboardData>) => {
      if (result.success && result.data) {
        setData(result.data)
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [])

  return { data, loading }
}
