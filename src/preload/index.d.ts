import { ElectronAPI } from '@electron-toolkit/preload'

interface WindowAPI {
  minimize: () => void
  maximize: () => void
  close: () => void
  isMaximized: () => Promise<boolean>
  onMaximized: (callback: (isMaximized: boolean) => void) => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      window: WindowAPI
      config: any
      accounts: any
      categories: any
      transactions: any
      transfers: any
      recurring: any
      alerts: any
      dashboard: any
      budgets: any
      goals: any
      credits: any
      creditCards: any
      patrimony: any
      simulator: any
      debtCapacity: any
      emergencyFund: any
      subscriptions: any
      health: any
      analytics: any
      recommendations: any
      decisionCenter: any
    }
  }
}
