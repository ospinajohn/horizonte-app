import { useState, useEffect, useCallback } from 'react'
import type { Category, CategoryType, ApiResult } from '../../../shared/types'

interface UseCategoriesReturn {
  categories: Category[]
  loading: boolean
}

export function useCategories(type?: CategoryType): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const result: ApiResult<Category[]> = await window.api.categories.getAll(type)
      if (result.success && result.data) {
        setCategories(result.data)
      }
    } catch {
      // silently fail — categories are non-critical
    } finally {
      setLoading(false)
    }
  }, [type])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return { categories, loading }
}
