import { ElectronAPI } from '@electron-toolkit/preload'

interface WindowAPI {
  minimize: () => void
  maximize: () => void
  close: () => void
  isMaximized: () => Promise<boolean>
  onMaximized: (callback: (isMaximized: boolean) => void) => void
}

interface UpdaterAPI {
  checkNow: () => Promise<void>
  download: () => Promise<void>
  install: () => Promise<void>
  onAvailable: (callback: (info: { version: string; releaseNotes: string | null }) => void) => void
  onProgress: (callback: (progress: { percent: number }) => void) => void
  onDownloaded: (callback: (info: { version: string }) => void) => void
  onError: (callback: (error: { message: string }) => void) => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      window: WindowAPI
      updater: UpdaterAPI
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
