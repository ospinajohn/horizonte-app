/**
 * Tipos compartidos entre main process y renderer
 * Derivados del schema de Prisma + enums del dominio financiero
 */

// ─── Enums del dominio ────────────────────────────────────────────────────────

export type AccountType =
  | 'BANCO'
  | 'EFECTIVO'
  | 'NEQUI'
  | 'DAVIPLATA'
  | 'TARJETA'
  | 'AHORROS'
  | 'INVERSION'

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER_IN' | 'TRANSFER_OUT'

export type PaymentMethod = 'CASH' | 'DEBIT' | 'CREDIT' | 'TRANSFER'

export type RecurrenceType = 'NONE' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'ANNUAL'

export type BudgetPeriod = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'

export type SavingsGoalPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL'

export type AlertType =
  | 'PAYMENT_DUE'
  | 'BUDGET_EXCEEDED'
  | 'BUDGET_WARNING'
  | 'NEGATIVE_BALANCE'
  | 'GOAL_ACHIEVED'
  | 'CUSTOM'

export type CategoryType = 'INCOME' | 'EXPENSE'

export type RecurringItemType = 'INCOME' | 'EXPENSE' | 'PAYMENT'

// ─── Entidades del dominio ────────────────────────────────────────────────────

export interface AppConfig {
  id: number
  userName: string
  currency: string
  language: string
  theme: string
  weekStartDay: number
  payDay: number
  secondPayDay: number | null
  onboardingCompleted: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Account {
  id: number
  name: string
  type: AccountType
  initialBalance: number
  color: string
  icon: string
  isEmergencyFund: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  // Calculado en runtime
  currentBalance?: number
}

export interface Category {
  id: number
  name: string
  type: CategoryType
  icon: string
  color: string
  isDefault: boolean
  isActive: boolean
  createdAt: Date
}

export interface Transaction {
  id: number
  type: TransactionType
  amount: number
  date: Date
  description: string | null
  notes: string | null
  tags: string[] | null
  receiptPath: string | null
  paymentMethod: PaymentMethod | null
  isRecurring: boolean
  createdAt: Date
  updatedAt: Date
  accountId: number
  categoryId: number | null
  recurringItemId: number | null
  linkedTransferId: number | null
  // Relaciones expandidas
  account?: Account
  category?: Category
}

export interface Transfer {
  id: number
  amount: number
  date: Date
  description: string | null
  createdAt: Date
  fromAccountId: number
  toAccountId: number
  fromAccount?: Account
  toAccount?: Account
}

export interface RecurringItem {
  id: number
  name: string
  type: RecurringItemType
  amount: number
  recurrence: RecurrenceType
  nextDate: Date
  endDate: Date | null
  description: string | null
  categoryId: number | null
  accountId: number | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  category?: Category
  account?: Account
}

export interface Budget {
  id: number
  name: string
  period: BudgetPeriod
  startDate: Date
  endDate: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  categories?: BudgetCategory[]
}

export interface BudgetCategory {
  id: number
  limit: number
  spent: number
  budgetId: number
  categoryId: number
  category?: Category
  // Calculados
  remaining?: number
  percentage?: number
}

export interface SavingsGoal {
  id: number
  name: string
  targetAmount: number
  currentAmount: number
  deadline: Date | null
  priority: SavingsGoalPriority
  icon: string
  color: string
  monthlyTarget: number | null
  isCompleted: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  accountId: number | null
  account?: Account
  contributions?: SavingsContribution[]
}

export interface SavingsContribution {
  id: number
  amount: number
  date: Date
  notes: string | null
  isAutomatic: boolean
  createdAt: Date
  goalId: number
}

export interface Alert {
  id: number
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  isRead: boolean
  isDismissed: boolean
  relatedId: number | null
  relatedType: string | null
  createdAt: Date
}

// ─── DTOs (Data Transfer Objects) para creación/edición ──────────────────────

export interface CreateAccountDto {
  name: string
  type: AccountType
  initialBalance: number
  color: string
  icon: string
  isEmergencyFund?: boolean
}

export interface UpdateAccountDto extends Partial<CreateAccountDto> {
  isActive?: boolean
}

export interface CreateTransactionDto {
  type: TransactionType
  amount: number
  date: Date
  description?: string
  notes?: string
  tags?: string[]
  receiptPath?: string
  paymentMethod?: PaymentMethod
  accountId: number
  categoryId?: number
  recurringItemId?: number
  isRecurring?: boolean
}

export interface CreateTransferDto {
  fromAccountId: number
  toAccountId: number
  amount: number
  date: Date
  description?: string
}

export interface CreateRecurringItemDto {
  name: string
  type: RecurringItemType
  amount: number
  recurrence: RecurrenceType
  nextDate: Date
  endDate?: Date
  description?: string
  categoryId?: number
  accountId?: number
}

export interface CreateBudgetDto {
  name: string
  period: BudgetPeriod
  startDate: Date
  endDate: Date
  categories: Array<{ categoryId: number; limit: number }>
}

export interface CreateSavingsGoalDto {
  name: string
  targetAmount: number
  deadline?: Date
  priority?: SavingsGoalPriority
  icon?: string
  color?: string
  monthlyTarget?: number
  accountId?: number
}

export interface CreateSavingsContributionDto {
  goalId: number
  amount: number
  date?: Date
  notes?: string
  isAutomatic?: boolean
}

// ─── Filtros para listados ────────────────────────────────────────────────────

export interface TransactionFilters {
  type?: TransactionType
  accountId?: number
  categoryId?: number
  from?: Date
  to?: Date
  search?: string
  tags?: string[]
  paymentMethod?: PaymentMethod
  page?: number
  pageSize?: number
}

// ─── Resultado genérico IPC ───────────────────────────────────────────────────

export interface ApiResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ─── Datos del dashboard ──────────────────────────────────────────────────────

export interface DashboardData {
  totalBalance: number
  monthIncome: number
  monthExpense: number
  monthBalance: number
  prevMonthIncome: number
  prevMonthExpense: number
  upcomingPayments: RecurringItem[]
  topGoals: SavingsGoal[]
  expensesByCategory: Array<{ categoryId: number; categoryName: string; color: string; amount: number }>
  cashflowChart: Array<{ date: string; income: number; expense: number; balance: number }>
  unreadAlerts: number
}

// ═══════════════════════════════════════════════════════════════════════════════
// FASE 2 — Tipos de nuevas entidades
// ═══════════════════════════════════════════════════════════════════════════════

export type CreditStatus = 'ACTIVE' | 'PAID' | 'OVERDUE'
export type AssetType = 'REAL_ESTATE' | 'VEHICLE' | 'TECH' | 'INVESTMENT' | 'OTHER'
export type SubscriptionCategory = 'ENTERTAINMENT' | 'PRODUCTIVITY' | 'CLOUD' | 'OTHER'
export type SimulationScenarioType =
  | 'SALARY_CHANGE'
  | 'NEW_CREDIT'
  | 'EARLY_PAYMENT'
  | 'BIG_PURCHASE'
  | 'UNEMPLOYMENT'
  | 'EXPENSE_CHANGE'
  | 'OTHER'

// ─── Créditos ─────────────────────────────────────────────────────────────────

export interface Credit {
  id: number
  entityName: string
  totalAmount: number
  pendingAmount: number
  annualRate: number
  monthlyPayment: number
  paymentDay: number
  totalInstallments: number
  paidInstallments: number
  status: CreditStatus
  startDate: Date
  notes: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  recurringItemId: number | null
  amortizationRows?: AmortizationRow[]
}

export interface AmortizationRow {
  id: number
  installment: number
  payment: number
  principal: number
  interest: number
  balance: number
  dueDate: Date
  isPaid: boolean
  creditId: number
}

export interface CreateCreditDto {
  entityName: string
  totalAmount: number
  pendingAmount: number
  annualRate: number
  monthlyPayment: number
  paymentDay: number
  totalInstallments: number
  paidInstallments?: number
  status?: CreditStatus
  startDate: Date
  notes?: string
}

// ─── Tarjetas de Crédito ──────────────────────────────────────────────────────

export interface CreditCard {
  id: number
  name: string
  bank: string
  totalLimit: number
  cutDay: number
  paymentDay: number
  annualRate: number
  color: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  purchases?: CreditCardPurchase[]
  // Calculados en runtime
  usedAmount?: number
  availableLimit?: number
}

export interface CreditCardPurchase {
  id: number
  description: string
  amount: number
  date: Date
  installments: number
  isAdvance: boolean
  billingPeriod: string | null
  cardId: number
}

export interface CreateCreditCardDto {
  name: string
  bank: string
  totalLimit: number
  cutDay: number
  paymentDay: number
  annualRate?: number
  color?: string
}

export interface CreateCreditCardPurchaseDto {
  cardId: number
  description: string
  amount: number
  date: Date
  installments?: number
  isAdvance?: boolean
  billingPeriod?: string
}

// ─── Activos ──────────────────────────────────────────────────────────────────

export interface Asset {
  id: number
  name: string
  type: AssetType
  currentValue: number
  acquisitionValue: number
  acquisitionDate: Date | null
  description: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateAssetDto {
  name: string
  type: AssetType
  currentValue: number
  acquisitionValue?: number
  acquisitionDate?: Date
  description?: string
}

// ─── Pasivos adicionales ──────────────────────────────────────────────────────

export interface Liability {
  id: number
  name: string
  amount: number
  creditor: string | null
  dueDate: Date | null
  notes: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateLiabilityDto {
  name: string
  amount: number
  creditor?: string
  dueDate?: Date
  notes?: string
}

// ─── Patrimonio ───────────────────────────────────────────────────────────────

export interface PatrimonyData {
  totalAssets: number
  totalLiabilities: number
  netWorth: number
  assets: Asset[]
  liabilities: Liability[]
  creditsPending: number
  creditCardDebt: number
  history: Array<{ snapshotDate: Date; netWorth: number; totalAssets: number; totalLiabilities: number }>
}

// ─── Suscripciones ────────────────────────────────────────────────────────────

export interface Subscription {
  id: number
  name: string
  amount: number
  billingDay: number
  category: SubscriptionCategory
  accountId: number | null
  isActive: boolean
  lastBilledAmount: number | null
  notes: string | null
  color: string
  icon: string
  createdAt: Date
  updatedAt: Date
  recurringItemId: number | null
}

export interface CreateSubscriptionDto {
  name: string
  amount: number
  billingDay: number
  category?: SubscriptionCategory
  accountId?: number
  notes?: string
  color?: string
  icon?: string
}

// ─── Simulación ───────────────────────────────────────────────────────────────

export interface SimulationScenario {
  id: number
  name: string
  type: SimulationScenarioType
  description: string | null
  parameters: string
  results: string | null
  createdAt: Date
}

export interface SimulationParams {
  type: SimulationScenarioType
  name: string
  // Parámetros variables según el tipo
  salaryChange?: number          // % de cambio de salario
  newCreditAmount?: number       // monto del nuevo crédito
  newCreditMonthlyPayment?: number
  newCreditMonths?: number
  earlyPaymentCreditId?: number
  earlyPaymentAmount?: number
  bigPurchaseAmount?: number
  expenseChangePercent?: number  // % de cambio en gastos
  unemploymentMonths?: number
}

export interface SimulationResult {
  scenarioName: string
  projectedBalance3M: number
  projectedBalance6M: number
  projectedBalance12M: number
  monthlyCashflow: number
  savingsCapacity: number
  debtRatio: number
  canAfford: boolean
  impactSummary: string
  recommendations: string[]
}

// ─── Capacidad de Endeudamiento ───────────────────────────────────────────────

export interface DebtCapacityData {
  monthlyIncome: number
  totalMonthlyDebt: number
  debtRatioPercent: number
  maxRecommendedPayment: number
  availableCapacity: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  creditDetails: Array<{ name: string; monthlyPayment: number }>
  cardDetails: Array<{ name: string; minimumPayment: number }>
}

// ─── Fondo de Emergencia ──────────────────────────────────────────────────────

export interface EmergencyFundData {
  monthlyExpenseAvg: number
  emergencyFundBalance: number
  monthsCovered: number
  targetMonths: number
  targetAmount: number
  missingAmount: number
  monthlyContributionNeeded: number
  emergencyAccounts: Account[]
}

// ═══════════════════════════════════════════════════════════════════════════════
// FASE 3 — Salud Financiera, Recomendaciones, Centro de Decisiones
// ═══════════════════════════════════════════════════════════════════════════════

export interface HealthFactors {
  liquidityScore: number        // 15%
  savingsScore: number          // 20%
  debtScore: number             // 20%
  patrimonyScore: number        // 10%
  budgetScore: number           // 15%
  emergencyFundScore: number    // 10%
  trendScore: number            // 5%
  diversificationScore: number  // 5%
}

export interface HealthScoreData {
  score: number
  factors: HealthFactors
  factorDetails: Array<{
    key: keyof HealthFactors
    label: string
    score: number
    weight: number
    description: string
    status: 'good' | 'warning' | 'danger'
  }>
  recommendations: string[]
  history: Array<{ snapshotDate: Date; score: number }>
}

export interface RecommendationLog {
  id: number
  type: 'SAVINGS' | 'DEBT_OPTIMIZATION' | 'TIMING' | 'INVESTMENT' | 'OTHER'
  title: string
  description: string
  impact: string | null
  actionPath: string | null
  isRead: boolean
  isApplied: boolean
  createdAt: Date
}

export interface DecisionQuery {
  id: number
  question: string
  answer: string
  context: string | null
  createdAt: Date
}

export interface DecisionAnswer {
  question: string
  answer: string
  verdict: 'YES' | 'NO' | 'CONDITIONAL' | 'INFO'
  details: string[]
  numbers: Array<{ label: string; value: string }>
  recommendation: string
}

export interface AnalyticsData {
  expensesByCategory: Array<{ categoryId: number; categoryName: string; color: string; amount: number; percentage: number }>
  monthlyComparison: Array<{ month: string; income: number; expense: number; balance: number }>
  savingsEvolution: Array<{ month: string; totalSaved: number }>
  cashflowByMonth: Array<{ month: string; income: number; expense: number }>
  insights: Array<{ type: 'positive' | 'warning' | 'info'; message: string }>
  periodLabel: string
  totalIncome: number
  totalExpense: number
  totalBalance: number
  vsLastPeriod: { incomeChange: number; expenseChange: number }
}

export interface ConfigData {
  userName: string
  currency: string
  language: string
  theme: string
  weekStartDay: number
  payDay: number
  secondPayDay: number | null
  notificationsEnabled: boolean
  alertDaysAhead: number
}
