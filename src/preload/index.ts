import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// ── Window controls ────────────────────────────────────────────────────────────
const windowAPI = {
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  onMaximized: (callback: (isMaximized: boolean) => void) => {
    ipcRenderer.on('window:maximized', (_event, value) => callback(value))
  }
}

// ── Domain API ─────────────────────────────────────────────────────────────────
const configAPI = {
  get: () => ipcRenderer.invoke('config:get'),
  update: (dto: any) => ipcRenderer.invoke('config:update', dto),
  completeOnboarding: () => ipcRenderer.invoke('config:completeOnboarding')
}

const accountsAPI = {
  getAll: () => ipcRenderer.invoke('accounts:getAll'),
  getById: (id: number) => ipcRenderer.invoke('accounts:getById', id),
  create: (dto: any) => ipcRenderer.invoke('accounts:create', dto),
  update: (id: number, dto: any) => ipcRenderer.invoke('accounts:update', id, dto),
  delete: (id: number) => ipcRenderer.invoke('accounts:delete', id),
  getTotalBalance: () => ipcRenderer.invoke('accounts:getTotalBalance'),
  hasTransactions: (id: number) => ipcRenderer.invoke('accounts:hasTransactions', id)
}

const categoriesAPI = {
  getAll: (type?: string) => ipcRenderer.invoke('categories:getAll', type),
  getById: (id: number) => ipcRenderer.invoke('categories:getById', id),
  create: (dto: any) => ipcRenderer.invoke('categories:create', dto),
  update: (id: number, dto: any) => ipcRenderer.invoke('categories:update', id, dto)
}

const transactionsAPI = {
  getAll: (filters?: any) => ipcRenderer.invoke('transactions:getAll', filters),
  getById: (id: number) => ipcRenderer.invoke('transactions:getById', id),
  create: (dto: any) => ipcRenderer.invoke('transactions:create', dto),
  update: (id: number, dto: any) => ipcRenderer.invoke('transactions:update', id, dto),
  delete: (id: number) => ipcRenderer.invoke('transactions:delete', id),
  getMonthSummary: (year: number, month: number) =>
    ipcRenderer.invoke('transactions:getMonthSummary', year, month),
  getExpensesByCategory: (from: Date, to: Date) =>
    ipcRenderer.invoke('transactions:getExpensesByCategory', from, to),
  getCashflowLast30Days: () => ipcRenderer.invoke('transactions:getCashflowLast30Days')
}

const transfersAPI = {
  getAll: () => ipcRenderer.invoke('transfers:getAll'),
  create: (dto: any) => ipcRenderer.invoke('transfers:create', dto),
  delete: (id: number) => ipcRenderer.invoke('transfers:delete', id)
}

const recurringAPI = {
  getAll: (onlyActive?: boolean) => ipcRenderer.invoke('recurring:getAll', onlyActive),
  getUpcoming: (days?: number) => ipcRenderer.invoke('recurring:getUpcoming', days),
  create: (dto: any) => ipcRenderer.invoke('recurring:create', dto),
  update: (id: number, dto: any) => ipcRenderer.invoke('recurring:update', id, dto),
  delete: (id: number) => ipcRenderer.invoke('recurring:delete', id),
  getProjection: (months?: number) => ipcRenderer.invoke('recurring:getProjection', months)
}

const alertsAPI = {
  getAll: (onlyUnread?: boolean) => ipcRenderer.invoke('alerts:getAll', onlyUnread),
  getUnreadCount: () => ipcRenderer.invoke('alerts:getUnreadCount'),
  create: (dto: any) => ipcRenderer.invoke('alerts:create', dto),
  markAsRead: (id: number) => ipcRenderer.invoke('alerts:markAsRead', id),
  markAllAsRead: () => ipcRenderer.invoke('alerts:markAllAsRead'),
  dismiss: (id: number) => ipcRenderer.invoke('alerts:dismiss', id),
  runEngine: () => ipcRenderer.invoke('alerts:runEngine')
}

const dashboardAPI = {
  getData: () => ipcRenderer.invoke('dashboard:getData')
}

const budgetsAPI = {
  getAll: () => ipcRenderer.invoke('budgets:getAll'),
  getActive: () => ipcRenderer.invoke('budgets:getActive'),
  getActiveWithSpending: () => ipcRenderer.invoke('budgets:getActiveWithSpending'),
  getWithSpending: (id: number) => ipcRenderer.invoke('budgets:getWithSpending', id),
  create: (dto: any) => ipcRenderer.invoke('budgets:create', dto),
  delete: (id: number) => ipcRenderer.invoke('budgets:delete', id)
}

const goalsAPI = {
  getAll: () => ipcRenderer.invoke('goals:getAll'),
  getById: (id: number) => ipcRenderer.invoke('goals:getById', id),
  create: (dto: any) => ipcRenderer.invoke('goals:create', dto),
  update: (id: number, dto: any) => ipcRenderer.invoke('goals:update', id, dto),
  delete: (id: number) => ipcRenderer.invoke('goals:delete', id),
  addContribution: (dto: any) => ipcRenderer.invoke('goals:addContribution', dto)
}

const creditsAPI = {
  getAll: () => ipcRenderer.invoke('credits:getAll'),
  getById: (id: number) => ipcRenderer.invoke('credits:getById', id),
  create: (dto: any) => ipcRenderer.invoke('credits:create', dto),
  update: (id: number, dto: any) => ipcRenderer.invoke('credits:update', id, dto),
  delete: (id: number) => ipcRenderer.invoke('credits:delete', id)
}

const creditCardsAPI = {
  getAll: () => ipcRenderer.invoke('creditCards:getAll'),
  getById: (id: number) => ipcRenderer.invoke('creditCards:getById', id),
  create: (dto: any) => ipcRenderer.invoke('creditCards:create', dto),
  update: (id: number, dto: any) => ipcRenderer.invoke('creditCards:update', id, dto),
  delete: (id: number) => ipcRenderer.invoke('creditCards:delete', id),
  addPurchase: (dto: any) => ipcRenderer.invoke('creditCards:addPurchase', dto),
  getWithBalance: (id: number) => ipcRenderer.invoke('creditCards:getWithBalance', id),
  getIntelligence: (id: number) => ipcRenderer.invoke('creditCards:getIntelligence', id),
  getAllIntelligence: () => ipcRenderer.invoke('creditCards:getAllIntelligence'),
  recommendForPurchase: (amount: number, categoryTag?: string) =>
    ipcRenderer.invoke('creditCards:recommendForPurchase', amount, categoryTag)
}

const patrimonyAPI = {
  getData: () => ipcRenderer.invoke('patrimony:getData'),
  takeSnapshot: () => ipcRenderer.invoke('patrimony:takeSnapshot'),
  createAsset: (dto: any) => ipcRenderer.invoke('patrimony:createAsset', dto),
  updateAsset: (id: number, dto: any) => ipcRenderer.invoke('patrimony:updateAsset', id, dto),
  deleteAsset: (id: number) => ipcRenderer.invoke('patrimony:deleteAsset', id),
  createLiability: (dto: any) => ipcRenderer.invoke('patrimony:createLiability', dto),
  deleteLiability: (id: number) => ipcRenderer.invoke('patrimony:deleteLiability', id)
}

const simulatorAPI = {
  simulate: (params: any) => ipcRenderer.invoke('simulator:simulate', params),
  saveScenario: (params: any, result: any) => ipcRenderer.invoke('simulator:saveScenario', params, result),
  getSavedScenarios: () => ipcRenderer.invoke('simulator:getSavedScenarios')
}

const debtCapacityAPI = {
  getData: () => ipcRenderer.invoke('debtCapacity:getData')
}

const emergencyFundAPI = {
  getData: () => ipcRenderer.invoke('emergencyFund:getData')
}

const subscriptionsAPI = {
  getAll: () => ipcRenderer.invoke('subscriptions:getAll'),
  create: (dto: any) => ipcRenderer.invoke('subscriptions:create', dto),
  update: (id: number, dto: any) => ipcRenderer.invoke('subscriptions:update', id, dto),
  delete: (id: number) => ipcRenderer.invoke('subscriptions:delete', id),
  getTotals: () => ipcRenderer.invoke('subscriptions:getTotals'),
  checkPriceChanges: () => ipcRenderer.invoke('subscriptions:checkPriceChanges')
}

const healthAPI = {
  getScore: () => ipcRenderer.invoke('health:getScore'),
  getHistory: () => ipcRenderer.invoke('health:getHistory'),
  saveSnapshot: () => ipcRenderer.invoke('health:saveSnapshot')
}

const analyticsAPI = {
  getData: (year: number, month: number, period: string) =>
    ipcRenderer.invoke('analytics:getData', year, month, period)
}

const recommendationsAPI = {
  generate: () => ipcRenderer.invoke('recommendations:generate'),
  getAll: () => ipcRenderer.invoke('recommendations:getAll'),
  markRead: (id: number) => ipcRenderer.invoke('recommendations:markRead', id),
  markApplied: (id: number) => ipcRenderer.invoke('recommendations:markApplied', id)
}

const decisionCenterAPI = {
  answer: (question: string) => ipcRenderer.invoke('decisionCenter:answer', question),
  saveQuery: (question: string, answer: any) =>
    ipcRenderer.invoke('decisionCenter:saveQuery', question, answer),
  getHistory: () => ipcRenderer.invoke('decisionCenter:getHistory')
}

// ── Expose al renderer ─────────────────────────────────────────────────────────
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', {
      window: windowAPI,
      config: configAPI,
      accounts: accountsAPI,
      categories: categoriesAPI,
      transactions: transactionsAPI,
      transfers: transfersAPI,
      recurring: recurringAPI,
      alerts: alertsAPI,
      dashboard: dashboardAPI,
      budgets: budgetsAPI,
      goals: goalsAPI,
      credits: creditsAPI,
      creditCards: creditCardsAPI,
      patrimony: patrimonyAPI,
      simulator: simulatorAPI,
      debtCapacity: debtCapacityAPI,
      emergencyFund: emergencyFundAPI,
      subscriptions: subscriptionsAPI,
      health: healthAPI,
      analytics: analyticsAPI,
      recommendations: recommendationsAPI,
      decisionCenter: decisionCenterAPI
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = {
    window: windowAPI,
    config: configAPI,
    accounts: accountsAPI,
    categories: categoriesAPI,
    transactions: transactionsAPI,
    transfers: transfersAPI,
    recurring: recurringAPI,
    alerts: alertsAPI,
    dashboard: dashboardAPI,
    budgets: budgetsAPI,
    goals: goalsAPI,
    credits: creditsAPI,
    creditCards: creditCardsAPI,
    patrimony: patrimonyAPI,
    simulator: simulatorAPI,
    debtCapacity: debtCapacityAPI,
    emergencyFund: emergencyFundAPI,
    subscriptions: subscriptionsAPI,
    health: healthAPI,
    analytics: analyticsAPI,
    recommendations: recommendationsAPI,
    decisionCenter: decisionCenterAPI
  }
}
