import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { AlertTriangle, X } from 'lucide-react'
import type { Account } from '../../../../shared/types'

interface DeleteAccountDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  account: Account | null
}

export function DeleteAccountDialog({ open, onClose, onSuccess, account }: DeleteAccountDialogProps): JSX.Element {
  const [hasTransactions, setHasTransactions] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)

  // Check if account has transactions when dialog opens
  const handleOpenChange = async (isOpen: boolean): Promise<void> => {
    if (isOpen && account) {
      setChecking(true)
      try {
        const result = await window.api.accounts.hasTransactions(account.id)
        setHasTransactions(result.success ? (result.data ?? false) : false)
      } catch {
        setHasTransactions(false)
      } finally {
        setChecking(false)
      }
    } else if (!isOpen) {
      onClose()
      setHasTransactions(null)
    }
  }

  const handleDelete = async (): Promise<void> => {
    if (!account) return
    setLoading(true)
    try {
      const result = await window.api.accounts.delete(account.id)
      if (result.success) {
        onSuccess()
        onClose()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-[#121418] border border-white/5 rounded-[28px] p-8 shadow-xl focus:outline-none">
          <div className="flex items-start justify-between mb-6">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle size={22} className="text-rose-400" />
            </div>
            <Dialog.Close asChild>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition-all"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Title className="text-lg font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white mb-2">
            Eliminar cuenta
          </Dialog.Title>

          {checking ? (
            <p className="text-sm text-gray-500 mb-6">Verificando...</p>
          ) : (
            <Dialog.Description className="text-sm text-gray-400 mb-6 leading-relaxed">
              {hasTransactions
                ? `La cuenta "${account?.name}" tiene transacciones registradas. Se desactivará pero no se eliminará permanentemente para conservar el historial.`
                : `¿Estás seguro de que quieres eliminar "${account?.name}"? Esta acción no se puede deshacer y se eliminará permanentemente.`}
            </Dialog.Description>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-10 rounded-2xl border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={loading || checking}
              className="flex-1 h-10 rounded-2xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition-all disabled:opacity-50"
            >
              {loading ? 'Eliminando...' : hasTransactions ? 'Desactivar' : 'Eliminar'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
