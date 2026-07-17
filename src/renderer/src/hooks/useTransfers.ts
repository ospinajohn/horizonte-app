import { useState, useEffect, useCallback } from 'react'
import type { Transfer, ApiResult } from '../../../shared/types'

interface UseTransfersReturn {
  transfers: Transfer[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useTransfers(): UseTransfersReturn {
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTransfers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result: ApiResult<Transfer[]> = await window.api.transfers.getAll()
      if (result.success && result.data) {
        setTransfers(result.data)
      } else {
        setError(result.error ?? 'Error al cargar transferencias')
      }
    } catch {
      setError('Error inesperado al cargar transferencias')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTransfers()
  }, [fetchTransfers])

  return { transfers, loading, error, refetch: fetchTransfers }
}
