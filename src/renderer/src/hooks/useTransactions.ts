import { useState, useEffect, useCallback } from 'react'
import type { Transaction, TransactionFilters, ApiResult, PaginatedResult } from '../../../shared/types'

interface UseTransactionsReturn {
  transactions: Transaction[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  } | null
}

export function useTransactions(filters?: TransactionFilters): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<UseTransactionsReturn['pagination']>(null)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result: ApiResult<PaginatedResult<Transaction>> = await window.api.transactions.getAll(filters)
      if (result.success && result.data) {
        setTransactions(result.data.items)
        setPagination({
          total: result.data.total,
          page: result.data.page,
          pageSize: result.data.pageSize,
          totalPages: result.data.totalPages
        })
      } else {
        setError(result.error ?? 'Error al cargar transacciones')
      }
    } catch (e) {
      setError('Error inesperado al cargar transacciones')
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filters)])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  return { transactions, loading, error, refetch: fetchTransactions, pagination }
}
