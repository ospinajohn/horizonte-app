import { useState, useEffect } from 'react'
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { DashboardPage } from './components/dashboard/DashboardPage'
import { AccountsPage } from './components/accounts/AccountsPage'
import { TransactionsPage } from './components/transactions/TransactionsPage'
import { TransfersPage } from './components/transfers/TransfersPage'
import { BudgetsPage } from './components/budgets/BudgetsPage'
import { GoalsPage } from './components/goals/GoalsPage'
import { PlannerPage } from './components/planner/PlannerPage'
import { AlertsPage } from './components/alerts/AlertsPage'
import { OnboardingFlow } from './components/onboarding/OnboardingFlow'
import { CreditsPage } from './components/credits/CreditsPage'
import { CreditCardsPage } from './components/creditCards/CreditCardsPage'
import { PatrimonyPage } from './components/patrimony/PatrimonyPage'
import { LaboratorioPage } from './components/laboratorio/LaboratorioPage'
import { SubscriptionsPage } from './components/subscriptions/SubscriptionsPage'
import { ReportsPage } from './components/reports/ReportsPage'
import { HealthPage } from './components/health/HealthPage'
import { DecisionCenterPage } from './components/decisionCenter/DecisionCenterPage'
import { SettingsPage } from './components/settings/SettingsPage'
import { CompromisosPage } from './components/compromisos/CompromisosPage'

function SplashScreen(): JSX.Element {
  return (
    <div className="fixed inset-0 bg-[#08090B] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-14 h-14 bg-[#10B981] rounded-2xl flex items-center justify-center"
          style={{ boxShadow: '0 0 30px rgba(16,185,129,0.4)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M3 17l5-5 4 4 9-10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#10B981]/60"
              style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }}
            />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function RouterContent(): JSX.Element {
  return (
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="cuentas" element={<AccountsPage />} />
          <Route path="transacciones" element={<TransactionsPage />} />
          <Route path="transferencias" element={<TransfersPage />} />
          <Route path="planificador" element={<PlannerPage />} />
          <Route path="metas" element={<GoalsPage />} />
          <Route path="presupuestos" element={<BudgetsPage />} />
          <Route path="alertas" element={<AlertsPage />} />
          <Route path="creditos" element={<CreditsPage />} />
          <Route path="tarjetas" element={<CreditCardsPage />} />
          <Route path="patrimonio" element={<PatrimonyPage />} />
          <Route path="suscripciones" element={<SubscriptionsPage />} />
          <Route path="compromisos" element={<CompromisosPage />} />
          <Route path="reportes" element={<ReportsPage />} />
          <Route path="laboratorio" element={<LaboratorioPage />} />
          <Route path="salud" element={<HealthPage />} />
          <Route path="decisiones" element={<DecisionCenterPage />} />
          <Route path="configuracion" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

function App(): JSX.Element {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [configLoaded, setConfigLoaded] = useState(false)

  useEffect(() => {
    window.api.config.get().then((result) => {
      if (result.success && result.data) {
        setShowOnboarding(!result.data.onboardingCompleted)
      }
      setConfigLoaded(true)
    }).catch(() => {
      setConfigLoaded(true)
    })
  }, [])

  if (!configLoaded) return <SplashScreen />
  if (showOnboarding) return <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
  return <RouterContent />
}

export default App
