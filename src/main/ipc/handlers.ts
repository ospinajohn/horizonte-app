/**
 * IPC Handlers — registra todos los canales de comunicación
 * entre el renderer y el main process
 */
import { ipcMain } from 'electron'
import { AccountService } from '../services/AccountService'
import { HealthScoreService } from '../services/HealthScoreService'
import { AnalyticsService } from '../services/AnalyticsService'
import { RecommendationsService } from '../services/RecommendationsService'
import { DecisionCenterService } from '../services/DecisionCenterService'
import { CategoryService } from '../services/CategoryService'
import { TransactionService } from '../services/TransactionService'
import { TransferService } from '../services/TransferService'
import { RecurringService } from '../services/RecurringService'
import { AlertService } from '../services/AlertService'
import { AlertEngineService } from '../services/AlertEngineService'
import { AppConfigService } from '../services/AppConfigService'
import { DashboardService } from '../services/DashboardService'
import { BudgetService } from '../services/BudgetService'
import { SavingsGoalService } from '../services/SavingsGoalService'
import { CreditService } from '../services/CreditService'
import { CreditCardService } from '../services/CreditCardService'
import { PatrimonyService } from '../services/PatrimonyService'
import { SimulatorService } from '../services/SimulatorService'
import { DebtCapacityService } from '../services/DebtCapacityService'
import { EmergencyFundService } from '../services/EmergencyFundService'
import { SubscriptionService } from '../services/SubscriptionService'

export function registerIpcHandlers(): void {
  // ── AppConfig ──────────────────────────────────────────────────────────────
  ipcMain.handle('config:get', () => AppConfigService.get())
  ipcMain.handle('config:update', (_e, dto) => AppConfigService.update(dto))
  ipcMain.handle('config:completeOnboarding', () => AppConfigService.completeOnboarding())

  // ── Accounts ───────────────────────────────────────────────────────────────
  ipcMain.handle('accounts:getAll', () => AccountService.getAll())
  ipcMain.handle('accounts:getById', (_e, id: number) => AccountService.getById(id))
  ipcMain.handle('accounts:create', (_e, dto) => AccountService.create(dto))
  ipcMain.handle('accounts:update', (_e, id: number, dto) => AccountService.update(id, dto))
  ipcMain.handle('accounts:delete', (_e, id: number) => AccountService.delete(id))
  ipcMain.handle('accounts:getTotalBalance', () => AccountService.getTotalBalance())
  ipcMain.handle('accounts:hasTransactions', (_e, id: number) =>
    AccountService.hasTransactions(id)
  )

  // ── Categories ─────────────────────────────────────────────────────────────
  ipcMain.handle('categories:getAll', (_e, type?) => CategoryService.getAll(type))
  ipcMain.handle('categories:getById', (_e, id: number) => CategoryService.getById(id))
  ipcMain.handle('categories:create', (_e, dto) => CategoryService.create(dto))
  ipcMain.handle('categories:update', (_e, id: number, dto) => CategoryService.update(id, dto))

  // ── Transactions ───────────────────────────────────────────────────────────
  ipcMain.handle('transactions:getAll', (_e, filters?) => TransactionService.getAll(filters))
  ipcMain.handle('transactions:getById', (_e, id: number) => TransactionService.getById(id))
  ipcMain.handle('transactions:create', (_e, dto) => TransactionService.create(dto))
  ipcMain.handle('transactions:update', (_e, id: number, dto) =>
    TransactionService.update(id, dto)
  )
  ipcMain.handle('transactions:delete', (_e, id: number) => TransactionService.delete(id))
  ipcMain.handle('transactions:getMonthSummary', (_e, year: number, month: number) =>
    TransactionService.getMonthSummary(year, month)
  )
  ipcMain.handle('transactions:getExpensesByCategory', (_e, from: Date, to: Date) =>
    TransactionService.getExpensesByCategory(from, to)
  )
  ipcMain.handle('transactions:getCashflowLast30Days', () =>
    TransactionService.getCashflowLast30Days()
  )

  // ── Transfers ──────────────────────────────────────────────────────────────
  ipcMain.handle('transfers:getAll', () => TransferService.getAll())
  ipcMain.handle('transfers:create', (_e, dto) => TransferService.create(dto))
  ipcMain.handle('transfers:delete', (_e, id: number) => TransferService.delete(id))

  // ── Recurring Items ────────────────────────────────────────────────────────
  ipcMain.handle('recurring:getAll', (_e, onlyActive?) => RecurringService.getAll(onlyActive))
  ipcMain.handle('recurring:getUpcoming', (_e, days?) => RecurringService.getUpcoming(days))
  ipcMain.handle('recurring:create', (_e, dto) => RecurringService.create(dto))
  ipcMain.handle('recurring:update', (_e, id: number, dto) => RecurringService.update(id, dto))
  ipcMain.handle('recurring:delete', (_e, id: number) => RecurringService.delete(id))
  ipcMain.handle('recurring:getProjection', (_e, months?) =>
    RecurringService.getProjection(months)
  )
  ipcMain.handle('recurring:markAsPaid', (_e, id: number) => RecurringService.markAsPaid(id))

  // ── Alerts ─────────────────────────────────────────────────────────────────
  ipcMain.handle('alerts:getAll', (_e, onlyUnread?) => AlertService.getAll(onlyUnread))
  ipcMain.handle('alerts:getUnreadCount', () => AlertService.getUnreadCount())
  ipcMain.handle('alerts:create', (_e, dto) => AlertService.create(dto))
  ipcMain.handle('alerts:markAsRead', (_e, id: number) => AlertService.markAsRead(id))
  ipcMain.handle('alerts:markAllAsRead', () => AlertService.markAllAsRead())
  ipcMain.handle('alerts:dismiss', (_e, id: number) => AlertService.dismiss(id))
  ipcMain.handle('alerts:runEngine', () => AlertEngineService.run())

  // ── Dashboard ──────────────────────────────────────────────────────────────
  ipcMain.handle('dashboard:getData', () => DashboardService.getData())

  // ── Budgets ────────────────────────────────────────────────────────────────
  ipcMain.handle('budgets:getAll', () => BudgetService.getAll())
  ipcMain.handle('budgets:getActive', () => BudgetService.getActive())
  ipcMain.handle('budgets:getActiveWithSpending', () => BudgetService.getActiveWithSpending())
  ipcMain.handle('budgets:getWithSpending', (_e, id: number) => BudgetService.getWithSpending(id))
  ipcMain.handle('budgets:create', (_e, dto) => BudgetService.create(dto))
  ipcMain.handle('budgets:delete', (_e, id: number) => BudgetService.delete(id))

  // ── Savings Goals ──────────────────────────────────────────────────────────
  ipcMain.handle('goals:getAll', () => SavingsGoalService.getAll())
  ipcMain.handle('goals:getById', (_e, id: number) => SavingsGoalService.getById(id))
  ipcMain.handle('goals:create', (_e, dto) => SavingsGoalService.create(dto))
  ipcMain.handle('goals:update', (_e, id: number, dto) => SavingsGoalService.update(id, dto))
  ipcMain.handle('goals:delete', (_e, id: number) => SavingsGoalService.delete(id))
  ipcMain.handle('goals:addContribution', (_e, dto) => SavingsGoalService.addContribution(dto))

  // ── Credits ────────────────────────────────────────────────────────────────
  ipcMain.handle('credits:getAll', () => CreditService.getAll())
  ipcMain.handle('credits:getById', (_e, id: number) => CreditService.getById(id))
  ipcMain.handle('credits:create', (_e, dto) => CreditService.create(dto))
  ipcMain.handle('credits:update', (_e, id: number, dto) => CreditService.update(id, dto))
  ipcMain.handle('credits:delete', (_e, id: number) => CreditService.delete(id))

  // ── Credit Cards ───────────────────────────────────────────────────────────
  ipcMain.handle('creditCards:getAll', () => CreditCardService.getAll())
  ipcMain.handle('creditCards:getById', (_e, id: number) => CreditCardService.getById(id))
  ipcMain.handle('creditCards:create', (_e, dto) => CreditCardService.create(dto))
  ipcMain.handle('creditCards:update', (_e, id: number, dto) => CreditCardService.update(id, dto))
  ipcMain.handle('creditCards:delete', (_e, id: number) => CreditCardService.delete(id))
  ipcMain.handle('creditCards:addPurchase', (_e, dto) => CreditCardService.addPurchase(dto))
  ipcMain.handle('creditCards:getWithBalance', (_e, id: number) => CreditCardService.getWithBalance(id))
  ipcMain.handle('creditCards:getIntelligence', (_e, id: number) => CreditCardService.getIntelligence(id))
  ipcMain.handle('creditCards:getAllIntelligence', () => CreditCardService.getAllIntelligence())
  ipcMain.handle('creditCards:recommendForPurchase', (_e, amount: number, categoryTag?: string) =>
    CreditCardService.recommendForPurchase(amount, categoryTag)
  )
  ipcMain.handle('creditCards:getPurchaseAnalytics', (_e, cardId?: number) =>
    CreditCardService.getPurchaseAnalytics(cardId)
  )

  // ── Patrimony ──────────────────────────────────────────────────────────────
  ipcMain.handle('patrimony:getData', () => PatrimonyService.getData())
  ipcMain.handle('patrimony:takeSnapshot', () => PatrimonyService.takeSnapshot())
  ipcMain.handle('patrimony:createAsset', (_e, dto) => PatrimonyService.createAsset(dto))
  ipcMain.handle('patrimony:updateAsset', (_e, id: number, dto) => PatrimonyService.updateAsset(id, dto))
  ipcMain.handle('patrimony:deleteAsset', (_e, id: number) => PatrimonyService.deleteAsset(id))
  ipcMain.handle('patrimony:createLiability', (_e, dto) => PatrimonyService.createLiability(dto))
  ipcMain.handle('patrimony:deleteLiability', (_e, id: number) => PatrimonyService.deleteLiability(id))

  // ── Simulator ──────────────────────────────────────────────────────────────
  ipcMain.handle('simulator:simulate', (_e, params) => SimulatorService.simulate(params))
  ipcMain.handle('simulator:saveScenario', (_e, params, result) => SimulatorService.saveScenario(params, result))
  ipcMain.handle('simulator:getSavedScenarios', () => SimulatorService.getSavedScenarios())

  // ── Debt Capacity ──────────────────────────────────────────────────────────
  ipcMain.handle('debtCapacity:getData', () => DebtCapacityService.getData())

  // ── Emergency Fund ─────────────────────────────────────────────────────────
  ipcMain.handle('emergencyFund:getData', () => EmergencyFundService.getData())

  // ── Subscriptions ──────────────────────────────────────────────────────────
  ipcMain.handle('subscriptions:getAll', () => SubscriptionService.getAll())
  ipcMain.handle('subscriptions:create', (_e, dto) => SubscriptionService.create(dto))
  ipcMain.handle('subscriptions:update', (_e, id: number, dto) => SubscriptionService.update(id, dto))
  ipcMain.handle('subscriptions:delete', (_e, id: number) => SubscriptionService.delete(id))
  ipcMain.handle('subscriptions:getTotals', () => SubscriptionService.getTotals())
  ipcMain.handle('subscriptions:checkPriceChanges', () => SubscriptionService.checkPriceChanges())

  // ── Health Score ───────────────────────────────────────────────────────────
  ipcMain.handle('health:getScore', () => HealthScoreService.calculateScore())
  ipcMain.handle('health:getHistory', () => HealthScoreService.getHistory())
  ipcMain.handle('health:saveSnapshot', () => HealthScoreService.saveSnapshot())

  // ── Analytics ─────────────────────────────────────────────────────────────
  ipcMain.handle('analytics:getData', (_e, year: number, month: number, period: string) =>
    AnalyticsService.getData(year, month, period as 'monthly' | 'quarterly' | 'annual')
  )

  // ── Recommendations ────────────────────────────────────────────────────────
  ipcMain.handle('recommendations:generate', () => RecommendationsService.generate())
  ipcMain.handle('recommendations:getAll', () => RecommendationsService.getAll())
  ipcMain.handle('recommendations:markRead', (_e, id: number) => RecommendationsService.markRead(id))
  ipcMain.handle('recommendations:markApplied', (_e, id: number) => RecommendationsService.markApplied(id))

  // ── Decision Center ────────────────────────────────────────────────────────
  ipcMain.handle('decisionCenter:answer', (_e, question: string) => DecisionCenterService.answer(question))
  ipcMain.handle('decisionCenter:saveQuery', (_e, question: string, answer: any) =>
    DecisionCenterService.saveQuery(question, answer)
  )
  ipcMain.handle('decisionCenter:getHistory', () => DecisionCenterService.getHistory())
}
