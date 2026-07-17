import { useState, useMemo } from 'react'
import { Plus, TrendingUp, TrendingDown } from 'lucide-react'
import { startOfMonth, endOfMonth } from 'date-fns'
import { cn, formatCurrency } from '@/lib/utils'
import { useTransactions } from '@/hooks/useTransactions'
import { TransactionList } from './TransactionList'
import { TransactionFormModal } from './TransactionFormModal'
import type { Transaction } from '../../../../shared/types'

type ModalMode = 'income' | 'expense'

export function TransactionsPage(): JSX.Element {
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<ModalMode>('income')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const now = new Date()
  const from = startOfMonth(now)
  const to = endOfMonth(now)

  const { transactions } = useTransactions({ from, to, pageSize: 1000 })

  const summary = useMemo(() => {
    let income = 0
    let expense = 0
    for (const tx of transactions) {
      if (tx.type === 'INCOME') income += tx.amount
      else if (tx.type === 'EXPENSE') expense += tx.amount
    }
    return { income, expense, balance: income - expense }
  }, [transactions])

  const openCreate = (mode: ModalMode): void => {
    setSelectedTransaction(null)
    setFormMode(mode)
    setFormOpen(true)
  }

  const handleEdit = (tx: Transaction): void => {
    setSelectedTransaction(tx)
    setFormMode(tx.type === 'INCOME' ? 'income' : 'expense')
    setFormOpen(true)
  }

  const handleDelete = async (tx: Transaction): Promise<void> => {
    const result = await window.api.transactions.delete(tx.id)
    if (result.success) setRefreshKey(k => k + 1)
  }

  const handleFormClose = (): void => {
    setFormOpen(false)
    setSelectedTransaction(null)
  }

  return (
    <div className="max-w-[1600px] mx-auto p-12 space-y-10">
      {/* Header */}
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold text-[#10B981] uppercase tracking-[0.4em] mb-3">
            Módulo Financiero // Transacciones
          </p>
          <h1 className="text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold tracking-tight">
            Transacciones
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => openCreate('income')}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#10B981] text-black font-bold text-sm rounded-2xl hover:bg-[#0ea371] transition-all"
          >
            <Plus size={15} />
            Ingreso
          </button>
          <button
            onClick={() => openCreate('expense')}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white font-bold text-sm rounded-2xl hover:bg-rose-600 transition-all"
          >
            <Plus size={15} />
            Gasto
          </button>
        </div>
      </header>

      {/* Period summary */}
      <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8 grid grid-cols-3 gap-6">
        {/* Income */}
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-[#10B981]/10 flex items-center justify-center shrink-0">
            <TrendingUp size={20} className="text-[#10B981]" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Ingresos</p>
            <p className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[#10B981]">
              {formatCurrency(summary.income)}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-l border-r border-white/5 flex items-center justify-center gap-4 px-6">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 flex items-center justify-center shrink-0">
            <TrendingDown size={20} className="text-rose-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Gastos</p>
            <p className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-rose-400">
              {formatCurrency(summary.expense)}
            </p>
          </div>
        </div>

        {/* Balance */}
        <div className="flex items-end justify-end">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Balance del período</p>
            <p className={cn(
              "text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold",
              summary.balance >= 0 ? 'text-[#10B981]' : 'text-rose-400'
            )}>
              {summary.balance >= 0 ? '+' : ''}{formatCurrency(summary.balance)}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction list */}
      <TransactionList
        key={refreshKey}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Modal */}
      <TransactionFormModal
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={() => setRefreshKey(k => k + 1)}
        mode={formMode}
        transaction={selectedTransaction}
      />
    </div>
  )
}
