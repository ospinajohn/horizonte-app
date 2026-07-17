import { useState, useEffect, useCallback } from 'react'
import type { Account, ApiResult } from '../../../shared/types'

interface UseAccountsReturn {
  accounts: Account[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  totalBalance: number
}

export function useAccounts(): UseAccountsReturn {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result: ApiResult<Account[]> = await window.api.accounts.getAll()
      if (result.success && result.data) {
        setAccounts(result.data)
      } else {
        setError(result.error ?? 'Error al cargar cuentas')
      }
    } catch (e) {
      setError('Error inesperado al cargar cuentas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.currentBalance ?? acc.initialBalance), 0)

  return { accounts, loading, error, refetch: fetchAccounts, totalBalance }
}
