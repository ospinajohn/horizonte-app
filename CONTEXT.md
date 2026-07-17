# CONTEXT.md — Horizonte App

> Archivo de contexto permanente del proyecto. Todo agente o sesión nueva debe leer este archivo primero antes de hacer cualquier cambio. Se debe mantener actualizado después de cada tarea significativa.

---

## Descripción del Producto

**Horizonte** es un asistente financiero personal de escritorio para Windows. No es un simple registrador de gastos — es un copiloto financiero que responde preguntas como:

- ¿Cuánto dinero tengo disponible ahora mismo?
- ¿Qué pasará con mis finanzas la próxima quincena?
- ¿Puedo asumir esta deuda?
- ¿Estoy ahorrando suficiente?
- ¿Qué decisión financiera me conviene tomar?

El sistema centraliza toda la información financiera del usuario y entrega proyecciones, simulaciones y recomendaciones inteligentes.

---

## Ubicación del Proyecto

```
C:\Users\USUARIO\Desktop\devs\horizonte-app\
```

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Desktop shell | Electron | ^33.2.1 |
| Build tool | electron-vite | ^2.3.0 |
| Frontend | React | ^18.3.1 |
| Lenguaje | TypeScript | ^5.7.2 |
| Bundler | Vite | ^5.4.11 (NO usar v6 — incompatible con electron-vite 2.x) |
| UI components | Shadcn/ui (Radix UI) | varios |
| Estilos | Tailwind CSS | ^3.4.17 |
| Gráficas | Recharts | ^3.0.0 |
| ORM | Prisma | ^5.22.0 |
| Base de datos | SQLite (via Prisma) | — |
| Estado global | Zustand | ^5.0.3 |
| Formularios | React Hook Form + Zod | ^7.54.2 / ^3.24.1 |
| Resolvers forms | @hookform/resolvers | ^3.9.1 |
| Fechas | date-fns | ^4.1.0 |
| Iconos | Lucide React | ^0.469.0 |
| Routing | React Router (MemoryRouter) | ^7.1.1 |
| PDF export | jsPDF + html2canvas | (Fase 2) |
| Excel export | xlsx (SheetJS) | (Fase 2) |
| Notificaciones | Electron Notification API | nativa |
| Empaquetado | electron-builder | ^25.1.8 |

---

## Arquitectura del Proyecto

```
Electron Main Process (Node.js)
  └── src/main/
        ├── index.ts              ← Entrada principal, crea BrowserWindow
        ├── database/client.ts    ← Singleton Prisma (ruta dinámica dev/prod)
        ├── ipc/handlers.ts       ← Registra TODOS los ipcMain.handle()
        └── services/             ← Lógica de negocio con Prisma Client

Preload Script (bridge seguro)
  └── src/preload/index.ts        ← contextBridge → window.api.*

Renderer Process (React)
  └── src/renderer/src/
        ├── App.tsx               ← Router principal (MemoryRouter)
        ├── main.tsx              ← ReactDOM.createRoot
        ├── components/           ← UI por módulo
        ├── hooks/                ← Hooks IPC (useAccounts, etc.)
        ├── store/                ← Zustand store global
        ├── lib/utils.ts          ← cn, formatCurrency, formatPercent, etc.
        └── styles/globals.css    ← Variables CSS del tema

Shared
  └── src/shared/types.ts         ← Tipos compartidos entre main y renderer

Base de datos
  └── prisma/
        ├── schema.prisma         ← Schema completo con todos los modelos
        ├── migrations/           ← Migraciones aplicadas
        └── seed.ts               ← Datos de ejemplo para desarrollo
```

### Flujo de datos (regla fundamental)

```
React UI → window.api.X() → IPC (preload) → ipcMain.handle → Service → Prisma → SQLite
```

- **El renderer NUNCA accede a Prisma directamente** — solo via `window.api.*`
- **Todos los IPC están en** `src/main/ipc/handlers.ts`
- **Toda la lógica de negocio está en** `src/main/services/`

---

## Estructura de Carpetas Detallada

```
horizonte-app/
├── doc/
│   ├── CONTEXT.md          ← Este archivo (siempre leer primero)
│   ├── design.md           ← Sistema de diseño completo (siempre seguir)
│   └── fases/
│       ├── fase-1-mvp.md   ← Tasks 1-14
│       ├── fase-2.md       ← Tasks 15-23
│       └── fase-3.md       ← Tasks 24-29
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── main/
│   │   ├── index.ts
│   │   ├── database/client.ts
│   │   ├── ipc/handlers.ts
│   │   └── services/
│   │       ├── AccountService.ts
│   │       ├── AlertService.ts
│   │       ├── AlertEngineService.ts  ← motor alertas (arranca con la app + cada hora)
│   │       ├── AppConfigService.ts
│   │       ├── BudgetService.ts
│   │       ├── CategoryService.ts
│   │       ├── DashboardService.ts
│   │       ├── RecurringService.ts
│   │       ├── SavingsGoalService.ts
│   │       ├── TransactionService.ts
│   │       └── TransferService.ts
│   ├── preload/
│   │   ├── index.ts        ← contextBridge con window.api completo
│   │   └── index.d.ts      ← tipos de window.api
│   ├── renderer/
│   │   ├── index.html
│   │   └── src/
│   │       ├── App.tsx
│   │       ├── main.tsx
│   │       ├── components/
│   │       │   ├── layout/
│   │       │   │   ├── TitleBar.tsx       ← barra sin chrome nativa
│   │       │   │   ├── Sidebar.tsx        ← nav solo iconos + tooltips
│   │       │   │   └── AppLayout.tsx      ← wrapper TitleBar + Sidebar + Outlet
│   │       │   ├── dashboard/
│   │       │   │   ├── DashboardPage.tsx  ← conectado a useDashboard()
│   │       │   │   ├── LiquidityCard.tsx
│   │       │   │   ├── PaydayCard.tsx
│   │       │   │   ├── TelemetryChart.tsx ← SVG animado con dibujo de línea
│   │       │   │   ├── HealthGauge.tsx    ← gauge circular SVG
│   │       │   │   ├── DecisionLog.tsx    ← terminal estilo
│   │       │   │   ├── GoalsCard.tsx
│   │       │   │   └── SmartDecisionCard.tsx
│   │       │   ├── accounts/
│   │       │   │   ├── AccountsPage.tsx
│   │       │   │   ├── AccountCard.tsx
│   │       │   │   ├── AccountFormModal.tsx
│   │       │   │   └── DeleteAccountDialog.tsx
│   │       │   ├── transactions/
│   │       │   │   ├── TransactionsPage.tsx
│   │       │   │   ├── TransactionList.tsx
│   │       │   │   ├── TransactionItem.tsx
│   │       │   │   └── TransactionFormModal.tsx
│   │       │   ├── transfers/
│   │       │   │   ├── TransfersPage.tsx
│   │       │   │   └── TransferFormModal.tsx
│   │       │   ├── budgets/
│   │       │   │   ├── BudgetsPage.tsx
│   │       │   │   ├── BudgetProgress.tsx
│   │       │   │   └── BudgetFormModal.tsx
│   │       │   ├── goals/
│   │       │   │   ├── GoalsPage.tsx
│   │       │   │   ├── GoalCard.tsx
│   │       │   │   ├── GoalFormModal.tsx
│   │       │   │   └── ContributionModal.tsx
│   │       │   ├── planner/
│   │       │   │   └── PlannerPage.tsx
│   │       │   ├── alerts/
│   │       │   │   └── AlertsPage.tsx
│   │       │   └── onboarding/
│   │       │       └── OnboardingFlow.tsx
│   │       │   └── ui/
│   │       │       ├── button.tsx
│   │       │       ├── card.tsx
│   │       │       ├── badge.tsx
│   │       │       ├── input.tsx
│   │       │       ├── progress.tsx
│   │       │       ├── separator.tsx
│   │       │       ├── skeleton.tsx
│   │       │       └── tooltip.tsx
│   │       ├── hooks/
│   │       │   ├── useAccounts.ts
│   │       │   ├── useBudgets.ts
│   │       │   ├── useCategories.ts
│   │       │   ├── useCountUp.ts
│   │       │   ├── useDashboard.ts
│   │       │   ├── useGoals.ts
│   │       │   ├── useTransactions.ts
│   │       │   └── useTransfers.ts
│   │       ├── store/
│   │       │   └── useAppStore.ts     ← Zustand (accounts, categories, UI)
│   │       ├── lib/
│   │       │   └── utils.ts           ← cn, formatCurrency, formatPercent, etc.
│   │       └── styles/
│   │           └── globals.css        ← variables CSS tema oscuro financiero
│   └── shared/
│       └── types.ts                   ← tipos Account, Transaction, Budget, etc.
├── .env                               ← DATABASE_URL para desarrollo
├── electron.vite.config.ts
├── electron-builder.yml
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json / tsconfig.node.json / tsconfig.web.json
└── inde.html                          ← maqueta visual original de referencia
```

---

## Base de Datos

### Ruta

- **Desarrollo:** `prisma/dev.db` (apunta via `DATABASE_URL=file:./dev.db`)
- **Producción:** `userData/database/horizonte.db` (definido en `src/main/database/client.ts`)

### Modelos Prisma actuales (Fase 1)

| Modelo | Descripción |
|---|---|
| `AppConfig` | Configuración del usuario (moneda, idioma, día de pago, onboarding) |
| `Account` | Cuentas financieras (Banco, Efectivo, Nequi, Daviplata, Tarjeta, Ahorros, Inversión) |
| `Category` | Categorías de ingresos y gastos (20 predefinidas via seed) |
| `Transaction` | Movimientos (INCOME, EXPENSE, TRANSFER_IN, TRANSFER_OUT) |
| `Transfer` | Transferencias entre cuentas (crea 2 Transaction atómicamente) |
| `RecurringItem` | Pagos e ingresos recurrentes (salario, arriendo, servicios, etc.) |
| `Budget` | Presupuestos por período (mensual, quincenal, semanal) |
| `BudgetCategory` | Límite y gasto por categoría dentro de un presupuesto |
| `SavingsGoal` | Metas de ahorro con progreso y fecha límite |
| `SavingsContribution` | Aportes individuales a una meta |
| `Alert` | Alertas del sistema (pagos próximos, presupuesto excedido, etc.) |

### Comandos útiles

```bash
# Generar cliente Prisma
npm run db:generate

# Crear nueva migración (desarrollo)
npm run db:migrate:dev

# Correr seed con datos de ejemplo
npm run db:seed

# Abrir Prisma Studio
npm run db:studio
```

---

## API IPC Completa (`window.api.*`)

Todos los métodos disponibles en el renderer via `contextBridge`:

```typescript
window.api.window     // minimize, maximize, close, isMaximized, onMaximized
window.api.config     // get, update, completeOnboarding
window.api.accounts   // getAll, getById, create, update, delete, getTotalBalance, hasTransactions
window.api.categories // getAll, getById, create, update
window.api.transactions // getAll, getById, create, update, delete, getMonthSummary, getExpensesByCategory, getCashflowLast30Days
window.api.transfers  // getAll, create, delete
window.api.recurring  // getAll, getUpcoming, create, update, delete, getProjection
window.api.alerts     // getAll, getUnreadCount, create, markAsRead, markAllAsRead, dismiss
window.api.dashboard  // getData
window.api.budgets    // getAll, getActive, getActiveWithSpending, getWithSpending, create, delete
window.api.goals      // getAll, getById, create, update, delete, addContribution
window.api.credits      // getAll, getById, create, update, delete
window.api.creditCards  // getAll, getById, create, update, delete, addPurchase, getWithBalance
window.api.patrimony    // getData, takeSnapshot, createAsset, updateAsset, deleteAsset, createLiability, deleteLiability
window.api.simulator    // simulate, saveScenario, getSavedScenarios
window.api.debtCapacity // getData
window.api.emergencyFund // getData
window.api.subscriptions // getAll, create, update, delete, getTotals, checkPriceChanges
window.api.health        // getScore, getHistory, saveSnapshot
window.api.analytics     // getData(year, month, period)
window.api.recommendations // generate, getAll, markRead, markApplied
window.api.decisionCenter  // answer, saveQuery, getHistory
```

---

## Rutas de la App (React Router — MemoryRouter)

| Ruta | Componente | Estado |
|---|---|---|
| `/` | `DashboardPage` | ✅ Implementado con datos reales |
| `/cuentas` | `AccountsPage` | ✅ CRUD completo |
| `/transacciones` | `TransactionsPage` | ✅ Ingresos + Gastos |
| `/transferencias` | `TransfersPage` | ✅ Implementado |
| `/presupuestos` | `BudgetsPage` | ✅ Implementado |
| `/metas` | `GoalsPage` | ✅ Implementado — metas con progreso circular, aportes, modal crear/editar |
| `/planificador` | `PlannerPage` | ✅ Implementado — proyección AreaChart + calendario + próximos 30 días |
| `/alertas` | `AlertsPage` | ✅ Implementado — tabs, marcar leída, descartar |
| `/creditos` | `CreditsPage` | ✅ Implementado — CRUD créditos, amortización francesa, RecurringItem automático |
| `/tarjetas` | `CreditCardsPage` | ✅ Implementado — CRUD tarjetas, registro de compras, cupo disponible |
| `/patrimonio` | `PatrimonyPage` | ✅ Implementado — activos, pasivos, AreaChart histórico, snapshot mensual |
| `/simulador` | `SimulatorPage` | ✅ Implementado — 5 escenarios, proyecciones 3/6/12 meses, guardar escenarios |
| `/endeudamiento` | `DebtCapacityPage` | ✅ Implementado — gauge SVG, calculadora interactiva, semáforo |
| `/fondo-emergencia` | `EmergencyFundPage` | ✅ Implementado — progress ring, meses cubiertos, recomendación mensual |
| `/suscripciones` | `SubscriptionsPage` | ✅ Implementado — CRUD suscripciones, presets, detección cambio precio |
| `/reportes` | `ReportsPage` | ✅ Implementado — 4 reportes, exportación CSV, impresión/PDF |
| `/configuracion` | `SettingsPage` | ✅ Implementado — perfil, moneda, días de pago, exportar CSV, reset onboarding |
| `/analitica` | `AnalyticsPage` | ✅ Implementado — donut, bar, area charts, insights automáticos |
| `/salud` | `HealthPage` | ✅ Implementado — gauge SVG animado, 8 factores, historial |
| `/recomendaciones` | `RecommendationsPage` | ✅ Implementado — 4 tipos, tabs, marcar aplicada |
| `/decisiones` | `DecisionCenterPage` | ✅ Implementado — 6 tipos de pregunta, historial colapsable |

---

## Estado de Implementación por Fases

### Fase 1 — MVP ✅ COMPLETA

| Task | Descripción | Estado |
|---|---|---|
| Task 1 | Scaffolding del proyecto | ✅ Completo |
| Task 2 | Prisma schema + migraciones + seed | ✅ Completo |
| Task 3 | IPC Bridge + servicios base | ✅ Completo |
| Task 4 | Módulo de Cuentas (CRUD) | ✅ Completo |
| Task 5 | Módulo de Ingresos | ✅ Completo |
| Task 6 | Módulo de Gastos | ✅ Completo |
| Task 7 | Módulo de Transferencias | ✅ Completo |
| Task 8 | Layout + Navegación | ✅ Completo |
| Task 9 | Dashboard con datos reales | ✅ Completo |
| Task 10 | Presupuestos | ✅ Completo (BudgetService + BudgetsPage + BudgetProgress + BudgetFormModal) |
| Task 11 | Metas de Ahorro | ✅ Completo — GoalCard, GoalFormModal, ContributionModal, GoalsPage, useGoals hook |
| Task 12 | Planificador (flujo de caja + calendario) | ✅ Completo — PlannerPage con AreaChart, calendario financiero, tabla próximos 30 días |
| Task 13 | Alertas inteligentes (motor + UI) | ✅ Completo — AlertEngineService en main, AlertsPage, badge dinámico en Sidebar |
| Task 14 | Onboarding | ✅ Completo — OnboardingFlow 5 pasos, SplashScreen, detección en App.tsx |

### Fase 2 — Tasks 15-23 ✅ COMPLETA

| Task | Descripción | Estado |
|---|---|---|
| Task 15 | Schema Prisma Fase 2 | ✅ Completo — modelos Credit, CreditCard, Asset, Liability, Subscription, SimulationScenario, PatrimonySnapshot |
| Task 16 | Módulo de Créditos | ✅ Completo — CreditService (amortización francesa), CreditsPage, CreditFormModal, AmortizationModal, RecurringItem automático |
| Task 17 | Módulo de Tarjetas de Crédito | ✅ Completo — CreditCardService, CreditCardsPage, CardFormModal, PurchaseFormModal, cupo calculado |
| Task 18 | Activos, Pasivos y Patrimonio Neto | ✅ Completo — PatrimonyService, PatrimonyPage, AssetFormModal, AreaChart histórico, snapshot mensual automático |
| Task 19 | Simulador Financiero | ✅ Completo — SimulatorService (cálculo en memoria), SimulatorPage, 5 escenarios, guardar escenario |
| Task 20 | Capacidad de Endeudamiento | ✅ Completo — DebtCapacityService, DebtCapacityPage, gauge SVG semáforo, calculadora interactiva |
| Task 21 | Fondo de Emergencia | ✅ Completo — EmergencyFundService, EmergencyFundPage, progress ring SVG animado |
| Task 22 | Módulo de Suscripciones | ✅ Completo — SubscriptionService, SubscriptionsPage, SubscriptionFormModal, presets, detección de cambios de precio |
| Task 23 | Reportes y Exportación | ✅ Completo — ReportsPage, 4 tipos de reporte, exportación CSV con Blob, impresión/PDF con window.print() |
### Fase 3 — Tasks 24-29 ✅ COMPLETA

| Task | Descripción | Estado |
|---|---|---|
| Task 24 | Motor de reglas + schema Fase 3 | ✅ Completo — modelos HealthSnapshot, RecommendationLog, DecisionQuery migrados |
| Task 25 | Salud Financiera 0-100 | ✅ Completo — HealthScoreService (8 factores), HealthPage con gauge SVG, historial BarChart |
| Task 26 | Analítica avanzada | ✅ Completo — AnalyticsService, AnalyticsPage (donut, bar, area charts, insights) |
| Task 27+28 | Alertas + Recomendaciones inteligentes | ✅ Completo — RecommendationsService (4 tipos), RecommendationsPage (tabs, acciones) |
| Task 29 | Centro de Decisiones + Configuración | ✅ Completo — DecisionCenterService (6 tipos de pregunta), DecisionCenterPage, SettingsPage |

---

## Sistema de Diseño (resumen ejecutivo)

**Ver `doc/design.md` para detalles completos. Estas son las reglas no negociables:**

| Elemento | Valor |
|---|---|
| Fondo global | `#08090B` |
| Fondo cards | `#121418` |
| Fondo sidebar | `#0A0B0D` |
| Color acento único | `#10B981` (emerald) |
| Borde estándar | `border-white/5` |
| Border radius cards | `rounded-[28px]` |
| Border radius botones | `rounded-2xl` |
| Padding cards | `p-10` |
| Gap grid | `gap-8` |
| Max width contenido | `max-w-[1600px] mx-auto p-12` |
| Tipografía títulos | `font-['Plus_Jakarta_Sans',sans-serif]` |
| Tipografía técnica | `font-['JetBrains_Mono',monospace]` |
| Labels descriptores | `text-[10px] font-bold uppercase tracking-widest text-gray-500` |
| Valor positivo | `text-[#10B981]` |
| Valor negativo | `text-rose-500` |
| Valor proyectado | `text-blue-400` |

**Reglas críticas:**
- NUNCA fondos blancos — siempre dark
- NUNCA bordes gruesos ni colores vivos
- El sidebar es SOLO iconos — sin texto visible
- Todos los valores monetarios usan `formatCurrency()` de `@/lib/utils`
- Todas las fechas usan `date-fns` con locale español

---

## Comandos de Desarrollo

```bash
# Iniciar en modo desarrollo (abre ventana Electron)
npm run dev

# Build de producción
npm run build

# Empaquetar instalador Windows (.exe)
npm run package

# Generar cliente Prisma (después de cambiar schema)
npm run db:generate

# Crear migración de desarrollo
npm run db:migrate:dev

# Ver datos en Prisma Studio
npm run db:studio

# Correr seed (datos de ejemplo)
npm run db:seed
```

---

## Convenciones de Código

### Estructura de componentes React

```typescript
// Siempre funcional con tipo de retorno explícito
export function MyComponent({ prop }: Props): JSX.Element {
  // hooks al inicio
  // handlers en el medio
  // return al final
}
```

### Hooks IPC

```typescript
// Patrón estándar de hook que consume IPC
export function useX(): UseXReturn {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    const result = await window.api.x.getAll()
    if (result.success && result.data) setData(result.data)
    else setError(result.error ?? 'Error')
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { data, loading, error, refetch: fetch }
}
```

### Servicios del main process

```typescript
// Siempre retornan ApiResult<T>
export const XService = {
  async getAll(): Promise<ApiResult<X[]>> {
    try {
      const data = await db().x.findMany(...)
      return { success: true, data }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }
}
```

### Formularios

- Siempre React Hook Form + Zod
- Modales siempre con `@radix-ui/react-dialog`
- Fondo modal: `bg-black/60 backdrop-blur-sm`
- Contenido modal: `bg-[#121418] border border-white/5 rounded-[28px] p-8`

---

## Skills Recomendadas por Tipo de Tarea

> Activar la skill correspondiente con `disclose_context` ANTES de implementar.

| Tarea | Skill a activar |
|---|---|
| Componentes UI / páginas React | `frontend-design` |
| Formularios con React Hook Form | `react-hook-form` |
| Validación con Zod | `zod` |
| Queries y schemas Prisma | `prisma-client-api` |
| Migraciones y CLI de Prisma | `prisma-cli` |
| Estilos Tailwind CSS | `tailwind-css-patterns` |
| Tipos avanzados TypeScript | `typescript-advanced-types` |
| Composición de componentes React | `vercel-composition-patterns` |
| Performance React / Next.js | `vercel-react-best-practices` |
| Accesibilidad WCAG | `accessibility` |

**Regla:** Si la tarea toca formularios → activar `react-hook-form` + `zod`. Si toca la base de datos → activar `prisma-client-api`. Si toca UI nueva → activar `frontend-design` + `tailwind-css-patterns`.

---

## Notas Técnicas Importantes

### Electron + Prisma
- El Prisma Client corre **solo en el main process** (Node.js). Nunca importar `@prisma/client` en el renderer.
- En producción, la DB está en `app.getPath('userData')/database/horizonte.db`
- `binaryTargets = ["native", "windows"]` en `schema.prisma` es obligatorio para el build de Windows

### Vite version lock
- **Vite está fijado en `^5.4.11`** — electron-vite 2.x NO es compatible con Vite 6.x. No actualizar.

### MemoryRouter
- Se usa `MemoryRouter` (no BrowserRouter ni HashRouter) porque Electron carga archivos locales y no tiene servidor HTTP.

### IPC y tipos
- Los objetos `Date` se serializan como strings al cruzar el IPC. Siempre hacer `new Date(value)` al recibir fechas del main process.
- Los arrays de tags se guardan como JSON string en SQLite — el `TransactionService` hace `JSON.stringify/parse`.

### Path aliases
- `@/` → `src/renderer/src/` (en el renderer)
- `@shared/` → `src/shared/` (en main y renderer)

---

## Historial de Cambios Recientes

| Fecha | Cambio |
|---|---|
| Sesión inicial | Scaffolding, Prisma schema, IPC bridge, seed |
| Sesión 2 | Maqueta HTML migrada a React, design.md creado, layout + sidebar |
| Sesión 3 | Tasks 4-9: Cuentas, Transacciones, Gastos, Transferencias, Dashboard real |
| Sesión 4 | BudgetService, SavingsGoalService, IPC handlers actualizados, BudgetsPage |
| Sesión 6 | Tasks 16-23: CreditService, CreditCardService, PatrimonyService, SimulatorService, DebtCapacityService, EmergencyFundService, SubscriptionService + todas las páginas UI (CreditsPage, CreditCardsPage, PatrimonyPage, SimulatorPage, DebtCapacityPage, EmergencyFundPage, SubscriptionsPage, ReportsPage) + App.tsx rutas + Sidebar Fase 2 + build ✅ |
| Sesión 7 | Tasks 25-29: HealthScoreService (8 factores), AnalyticsService, RecommendationsService, DecisionCenterService + IPC handlers + preload + HealthPage, AnalyticsPage, RecommendationsPage, DecisionCenterPage, SettingsPage + App.tsx rutas Fase 3 + Sidebar Fase 3 + build ✅ |

---

## Próximas Tareas

### Proyecto completo — Fase 3 ✅ COMPLETA

El proyecto Horizonte v1.0 está completo con todas las fases implementadas. Considera para una Fase 4:

- **Fase 4 — Posibles mejoras:**
  - Sincronización con bancos (Open Banking API)
  - Notificaciones nativas de Windows más avanzadas
  - Dashboard personalizable (drag & drop de widgets)
  - Exportación avanzada a Excel con SheetJS
  - Soporte multi-idioma (i18n)
  - Modo claro (light theme)
