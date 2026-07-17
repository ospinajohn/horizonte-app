import { useState } from 'react'
import { Plus, Wallet } from 'lucide-react'
import { useAccounts } from '@/hooks/useAccounts'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import { AccountCard } from './AccountCard'
import { AccountFormModal } from './AccountFormModal'
import { DeleteAccountDialog } from './DeleteAccountDialog'
import type { Account } from '../../../../shared/types'

export function AccountsPage(): JSX.Element {
  const { accounts, loading, refetch, totalBalance } = useAccounts()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)

  const handleEdit = (account: Account): void => {
    setSelectedAccount(account)
    setFormOpen(true)
  }

  const handleDelete = (account: Account): void => {
    setSelectedAccount(account)
    setDeleteOpen(true)
  }

  const handleCreateNew = (): void => {
    setSelectedAccount(null)
    setFormOpen(true)
  }

  const handleFormClose = (): void => {
    setFormOpen(false)
    setSelectedAccount(null)
  }

  const handleDeleteClose = (): void => {
    setDeleteOpen(false)
    setSelectedAccount(null)
  }

  return (
    <div className="max-w-[1600px] mx-auto p-12 space-y-10">
      {/* Header */}
      <header className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold text-[#10B981] uppercase tracking-[0.4em] mb-3">
            Módulo Financiero // Cuentas
          </p>
          <h1 className="text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold tracking-tight">
            Cuentas
          </h1>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-6 py-3 bg-[#10B981] text-black font-bold text-sm rounded-2xl hover:bg-[#0ea371] transition-all shadow-lg shadow-[#10B981]/20"
        >
          <Plus size={16} />
          Nueva Cuenta
        </button>
      </header>

      {/* Summary card */}
      <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8 flex items-center gap-8">
        <div className="w-14 h-14 rounded-2xl bg-[#10B981]/10 flex items-center justify-center shrink-0">
          <Wallet size={24} className="text-[#10B981]" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
            Saldo consolidado total
          </p>
          <p className="text-3xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white">
            {loading ? '—' : formatCurrency(totalBalance)}
          </p>
          {!loading && (
            <p className="text-xs text-gray-600 mt-1">{accounts.length} {accounts.length === 1 ? 'cuenta' : 'cuentas'} activas</p>
          )}
        </div>
      </div>

      {/* Accounts grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-[28px] bg-white/5" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
            <Wallet size={28} className="text-gray-600" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-3">
            Sin cuentas
          </p>
          <p className="text-lg font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-gray-400 mb-2">
            Aún no tienes cuentas registradas
          </p>
          <p className="text-sm text-gray-600 mb-8">
            Agrega tu primera cuenta para empezar a registrar tus finanzas
          </p>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-6 py-3 bg-[#10B981] text-black font-bold text-sm rounded-2xl hover:bg-[#0ea371] transition-all"
          >
            <Plus size={16} />
            Nueva Cuenta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map(account => (
            <AccountCard
              key={account.id}
              account={account}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AccountFormModal
        open={formOpen}
        onClose={handleFormClose}
        onSuccess={refetch}
        account={selectedAccount}
      />
      <DeleteAccountDialog
        open={deleteOpen}
        onClose={handleDeleteClose}
        onSuccess={refetch}
        account={selectedAccount}
      />
    </div>
  )
}
