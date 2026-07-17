import { create } from 'zustand'
import type { Account, Category } from '../../../shared/types'

type ActiveModal =
  | { type: 'create-account' }
  | { type: 'edit-account'; accountId: number }
  | { type: 'delete-account'; accountId: number }
  | { type: 'create-income' }
  | { type: 'create-expense' }
  | { type: 'edit-transaction'; transactionId: number }
  | { type: 'create-transfer' }
  | { type: 'create-budget' }
  | null

interface AppStore {
  // ── Accounts slice ────────────────────────────────────────────────────────
  accounts: Account[]
  loadingAccounts: boolean
  setAccounts: (accounts: Account[]) => void
  setLoadingAccounts: (loading: boolean) => void

  // ── Categories slice ──────────────────────────────────────────────────────
  categories: Category[]
  setCategories: (categories: Category[]) => void

  // ── UI slice ──────────────────────────────────────────────────────────────
  activeModal: ActiveModal
  setActiveModal: (modal: ActiveModal) => void
  closeModal: () => void
}

export const useAppStore = create<AppStore>((set) => ({
  // ── Accounts ─────────────────────────────────────────────────────────────
  accounts: [],
  loadingAccounts: false,
  setAccounts: (accounts) => set({ accounts }),
  setLoadingAccounts: (loadingAccounts) => set({ loadingAccounts }),

  // ── Categories ────────────────────────────────────────────────────────────
  categories: [],
  setCategories: (categories) => set({ categories }),

  // ── UI ────────────────────────────────────────────────────────────────────
  activeModal: null,
  setActiveModal: (activeModal) => set({ activeModal }),
  closeModal: () => set({ activeModal: null })
}))
