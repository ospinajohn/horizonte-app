import { useState } from 'react'
import { Plus, ArrowRight, ArrowLeftRight } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useTransfers } from '@/hooks/useTransfers'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import { TransferFormModal } from './TransferFormModal'
import type { Transfer } from '../../../../shared/types'

export function TransfersPage(): JSX.Element {
  const { transfers, loading, refetch } = useTransfers()
  const [formOpen, setFormOpen] = useState(false)

  const formatDate = (date: Date | string): Date => {
    return date instanceof Date ? date : new Date(date)
  }

  return (
    <div className="max-w-[1600px] mx-auto p-12 space-y-10">
      {/* Header */}
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.4em] mb-3">
            Módulo Financiero // Transferencias
          </p>
          <h1 className="text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold tracking-tight">
            Transferencias
          </h1>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-bold text-sm rounded-2xl hover:bg-blue-600 transition-all"
        >
          <Plus size={16} />
          Nueva Transferencia
        </button>
      </header>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : transfers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
            <ArrowLeftRight size={28} className="text-gray-600" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-3">
            Sin transferencias
          </p>
          <p className="text-lg font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-gray-400 mb-2">
            Aún no tienes transferencias
          </p>
          <p className="text-sm text-gray-600 mb-8">
            Mueve fondos entre tus cuentas de manera rápida
          </p>
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-bold text-sm rounded-2xl hover:bg-blue-600 transition-all"
          >
            <Plus size={16} />
            Nueva Transferencia
          </button>
        </div>
      ) : (
        <div className="bg-[#121418] border border-white/5 rounded-[28px] overflow-hidden">
          {transfers.map((transfer: Transfer, index: number) => {
            const d = formatDate(transfer.date)
            const fromName = transfer.fromAccount?.name ?? `Cuenta #${transfer.fromAccountId}`
            const toName = transfer.toAccount?.name ?? `Cuenta #${transfer.toAccountId}`

            return (
              <div
                key={transfer.id}
                className={`flex items-center gap-3 py-3 px-4 hover:bg-white/5 transition-all duration-150 ${
                  index !== transfers.length - 1 ? 'border-b border-white/5' : ''
                }`}
              >
                {/* Icon */}
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <ArrowLeftRight size={16} className="text-blue-400" />
                </div>

                {/* Accounts flow */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm text-gray-300 truncate max-w-[120px]">{fromName}</span>
                  <ArrowRight size={14} className="text-gray-600 shrink-0" />
                  <span className="text-sm text-gray-300 truncate max-w-[120px]">{toName}</span>
                </div>

                {/* Description */}
                {transfer.description && (
                  <p className="text-[11px] text-gray-600 hidden lg:block truncate max-w-[180px]">
                    {transfer.description}
                  </p>
                )}

                {/* Date */}
                <p className="text-[11px] text-gray-600 shrink-0">
                  {format(d, "d MMM yyyy", { locale: es })}
                </p>

                {/* Amount */}
                <p className="text-sm font-bold text-blue-400 font-mono shrink-0">
                  {formatCurrency(transfer.amount)}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      <TransferFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={refetch}
      />
    </div>
  )
}
