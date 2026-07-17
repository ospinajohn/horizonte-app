import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Pencil, Trash2 } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import type { Transaction } from '../../../../shared/types'

interface TransactionItemProps {
  transaction: Transaction
  onEdit: (transaction: Transaction) => void
  onDelete: (transaction: Transaction) => void
}

export function TransactionItem({ transaction, onEdit, onDelete }: TransactionItemProps): JSX.Element {
  const isIncome = transaction.type === 'INCOME'
  const isExpense = transaction.type === 'EXPENSE'
  const sign = isIncome ? '+' : '-'
  const amountClass = isIncome ? 'text-[#10B981]' : isExpense ? 'text-rose-400' : 'text-blue-400'

  const categoryColor = transaction.category?.color ?? '#6B7280'
  const categoryName = transaction.category?.name ?? 'Sin categoría'

  const displayDate = transaction.date instanceof Date
    ? transaction.date
    : new Date(transaction.date)

  return (
    <div className="group flex items-center gap-4 py-3 px-4 rounded-2xl hover:bg-white/5 transition-all duration-150">
      {/* Category icon circle */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-bold"
        style={{ backgroundColor: categoryColor + '28', border: `1px solid ${categoryColor}40` }}
      >
        <span style={{ color: categoryColor }}>{categoryName.charAt(0).toUpperCase()}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">
          {transaction.description ?? categoryName}
        </p>
        <p className="text-[11px] text-gray-600">
          {categoryName} · {format(displayDate, "d 'de' MMM", { locale: es })}
          {transaction.account && <> · {transaction.account.name}</>}
        </p>
      </div>

      {/* Amount */}
      <p className={cn('text-sm font-bold font-mono shrink-0', amountClass)}>
        {sign}{formatCurrency(transaction.amount)}
      </p>

      {/* Actions — visible on hover */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
        <button
          onClick={() => onEdit(transaction)}
          className="w-7 h-7 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-gray-600 hover:text-white transition-all"
          aria-label="Editar"
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={() => onDelete(transaction)}
          className="w-7 h-7 flex items-center justify-center rounded-xl bg-white/5 hover:bg-rose-500/20 text-gray-600 hover:text-rose-400 transition-all"
          aria-label="Eliminar"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}
