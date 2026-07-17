import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { startOfMonth, endOfMonth } from 'date-fns'
import { ChevronLeft, ChevronRight, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { useTransactions } from '@/hooks/useTransactions'
import { useAccounts } from '@/hooks/useAccounts'
import { useCategories } from '@/hooks/useCategories'
import { TransactionItem } from './TransactionItem'
import type { Transaction, TransactionType, TransactionFilters } from '../../../../shared/types'

interface TransactionListProps {
  onEdit: (transaction: Transaction) => void
  onDelete: (transaction: Transaction) => void
  onRefreshNeeded?: () => void
}

const TYPE_LABELS: Record<string, string> = {
  ALL: 'Todos',
  INCOME: 'Ingresos',
  EXPENSE: 'Gastos'
}

export function TransactionList({ onEdit, onDelete }: TransactionListProps): JSX.Element {
  const [typeFilter, setTypeFilter] = useState<'ALL' | TransactionType>('ALL')
  const [accountFilter, setAccountFilter] = useState<number | undefined>(undefined)
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>(undefined)
  const [page, setPage] = useState(1)

  const now = new Date()
  const [fromDate] = useState(() => startOfMonth(now))
  const [toDate] = useState(() => endOfMonth(now))

  const filters: TransactionFilters = useMemo(() => ({
    ...(typeFilter !== 'ALL' ? { type: typeFilter as TransactionType } : {}),
    ...(accountFilter ? { accountId: accountFilter } : {}),
    ...(categoryFilter ? { categoryId: categoryFilter } : {}),
    from: fromDate,
    to: toDate,
    page,
    pageSize: 50
  }), [typeFilter, accountFilter, categoryFilter, fromDate, toDate, page])

  const { transactions, loading, pagination } = useTransactions(filters)
  const { accounts } = useAccounts()
  const { categories } = useCategories()

  // Group by day
  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    for (const tx of transactions) {
      const d = tx.date instanceof Date ? tx.date : new Date(tx.date)
      const key = format(d, 'yyyy-MM-dd')
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(tx)
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [transactions])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Type filter */}
        <div className="flex bg-white/5 rounded-2xl p-1 gap-1">
          {(['ALL', 'INCOME', 'EXPENSE'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTypeFilter(t); setPage(1) }}
              className={cn(
                'px-4 py-1.5 rounded-xl text-xs font-bold transition-all',
                typeFilter === t
                  ? 'bg-[#10B981] text-black'
                  : 'text-gray-500 hover:text-white'
              )}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Account filter */}
        <select
          value={accountFilter ?? ''}
          onChange={e => { setAccountFilter(e.target.value ? Number(e.target.value) : undefined); setPage(1) }}
          className="h-9 rounded-2xl border border-white/5 bg-white/5 px-3 text-xs text-gray-300 focus:outline-none focus:border-[#10B981]/50"
        >
          <option value="" className="bg-[#121418]">Todas las cuentas</option>
          {accounts.map(a => (
            <option key={a.id} value={a.id} className="bg-[#121418]">{a.name}</option>
          ))}
        </select>

        {/* Category filter */}
        <select
          value={categoryFilter ?? ''}
          onChange={e => { setCategoryFilter(e.target.value ? Number(e.target.value) : undefined); setPage(1) }}
          className="h-9 rounded-2xl border border-white/5 bg-white/5 px-3 text-xs text-gray-300 focus:outline-none focus:border-[#10B981]/50"
        >
          <option value="" className="bg-[#121418]">Todas las categorías</option>
          {categories.map(c => (
            <option key={c.id} value={c.id} className="bg-[#121418]">{c.name}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <Receipt size={24} className="text-gray-600" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">
            Sin transacciones
          </p>
          <p className="text-sm text-gray-500">No hay transacciones en este período</p>
        </div>
      ) : (
        <div className="bg-[#121418] border border-white/5 rounded-[28px] overflow-hidden">
          {grouped.map(([dateKey, txs]) => {
            const d = new Date(dateKey + 'T00:00:00')
            return (
              <div key={dateKey}>
                <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    {format(d, "EEEE d 'de' MMMM", { locale: es })}
                  </p>
                </div>
                <div className="px-2 py-1">
                  {txs.map(tx => (
                    <TransactionItem key={tx.id} transaction={tx} onEdit={onEdit} onDelete={onDelete} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-all"
          >
            <ChevronLeft size={14} />
            Anterior
          </button>
          <span className="text-xs text-gray-600">
            {page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-all"
          >
            Siguiente
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
