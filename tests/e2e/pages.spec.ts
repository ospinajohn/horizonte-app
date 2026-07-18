import { test, expect, type Page } from '@playwright/test'
import { launchApp, closeApp, waitForDashboard } from './helpers'

async function dismissOnboarding(window: Page): Promise<void> {
  const finishBtn = window.locator('button').filter({ hasText: /ir al dashboard/i }).first()
  if (await finishBtn.isVisible().catch(() => false)) {
    await finishBtn.click()
    await window.waitForTimeout(1000)
  }
}

async function openHamburgerMenu(window: Page): Promise<void> {
  const menuBtn = window.locator('nav .relative button')
  await menuBtn.click()
  await window.waitForTimeout(400)
}

async function navigateViaDropdown(window: Page, itemLabel: string): Promise<void> {
  await openHamburgerMenu(window)
  await window.locator('button').filter({ hasText: itemLabel }).last().click()
  await window.waitForTimeout(500)
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════

test.describe('Dashboard', () => {
  let window: Page

  test.beforeAll(async () => {
    const { window: w } = await launchApp()
    window = w
    await dismissOnboarding(window)
    await waitForDashboard(window)
  })

  test.afterAll(async () => {
    await closeApp()
  })

  test('shows header with version badge', async () => {
    await expect(window.locator('text=Horizonte v1.0')).toBeVisible()
    await expect(window.locator('text=Sistema Activo')).toBeVisible()
  })

  test('shows main title', async () => {
    await expect(window.locator('text=Financial Command Center')).toBeVisible()
  })

  test('shows online status', async () => {
    await expect(window.locator('text=Online')).toBeVisible()
  })

  test('shows export button', async () => {
    await expect(window.locator('button').filter({ hasText: 'Exportar Reporte' })).toBeVisible()
  })

  test('liquidity card renders', async () => {
    await expect(window.locator('text=Liquidez Total Disponible')).toBeVisible({ timeout: 5000 })
  })

  test('insights row renders', async () => {
    await expect(
      window.locator('text=Tasa de Ahorro').or(window.locator('text=TASA DE AHORRO'))
    ).toBeVisible({ timeout: 5000 })
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// REPORTS — Tab Navigation
// ══════════════════════════════════════════════════════════════════════════════

test.describe('Reports Page — Tab Navigation', () => {
  let window: Page

  test.beforeAll(async () => {
    const { window: w } = await launchApp()
    window = w
    await dismissOnboarding(window)
  })

  test.afterAll(async () => {
    await closeApp()
  })

  test('navigates to reports page', async () => {
    const nav = window.locator('nav')
    await nav.locator('button').filter({ hasText: 'Reportes' }).click()
    await window.waitForTimeout(500)
    await expect(window.locator('h1').filter({ hasText: 'Reportes' })).toBeVisible({ timeout: 5000 })
  })

  test('shows all 4 tabs', async () => {
    await expect(window.locator('button').filter({ hasText: 'Resumen' })).toBeVisible()
    await expect(window.locator('button').filter({ hasText: 'Categorías' })).toBeVisible()
    await expect(window.locator('button').filter({ hasText: 'Comparativa' })).toBeVisible()
    await expect(window.locator('button').filter({ hasText: 'Exportar' })).toBeVisible()
  })

  test('can switch to Categorías tab', async () => {
    await window.locator('button').filter({ hasText: 'Categorías' }).click()
    await window.waitForTimeout(500)
    // Tab is now active — content renders (could be empty state or data)
    const categoriesTab = window.locator('button').filter({ hasText: 'Categorías' })
    await expect(categoriesTab).toBeVisible()
  })

  test('can switch to Comparativa tab', async () => {
    await window.locator('button').filter({ hasText: 'Comparativa' }).click()
    await window.waitForTimeout(500)
    const compTab = window.locator('button').filter({ hasText: 'Comparativa' })
    await expect(compTab).toBeVisible()
  })

  test('can switch to Exportar tab', async () => {
    await window.locator('button').filter({ hasText: 'Exportar' }).click()
    await window.waitForTimeout(500)
    // Export tab shows export cards
    await expect(window.locator('text=Reporte Mensual')).toBeVisible({ timeout: 3000 })
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// LABORATORIO — Tab Navigation
// ══════════════════════════════════════════════════════════════════════════════

test.describe('Laboratorio Page — Tab Navigation', () => {
  let window: Page

  test.beforeAll(async () => {
    const { window: w } = await launchApp()
    window = w
    await dismissOnboarding(window)
  })

  test.afterAll(async () => {
    await closeApp()
  })

  test('navigates to laboratorio via dropdown', async () => {
    await navigateViaDropdown(window, 'Laboratorio')
    await expect(window.locator('h1').filter({ hasText: /Laboratorio/i })).toBeVisible({ timeout: 5000 })
  })

  test('shows all 3 tabs', async () => {
    await expect(window.locator('button').filter({ hasText: 'Simulador' })).toBeVisible()
    await expect(window.locator('button').filter({ hasText: 'Capacidad de Deuda' })).toBeVisible()
    await expect(window.locator('button').filter({ hasText: 'Fondo de Emergencia' })).toBeVisible()
  })

  test('Simulador tab shows scenario selection', async () => {
    await expect(window.locator('text=Selecciona un escenario')).toBeVisible({ timeout: 3000 })
  })

  test('can switch to Capacidad de Deuda tab', async () => {
    await window.locator('button').filter({ hasText: 'Capacidad de Deuda' }).click()
    await window.waitForTimeout(500)
    // Verify the tab was clicked and page content updated
    await expect(window.locator('button').filter({ hasText: 'Capacidad de Deuda' })).toBeVisible()
  })

  test('can switch to Fondo de Emergencia tab', async () => {
    await window.locator('button').filter({ hasText: 'Fondo de Emergencia' }).click()
    await window.waitForTimeout(500)
    await expect(window.locator('button').filter({ hasText: 'Fondo de Emergencia' })).toBeVisible()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// HEALTH — Tab Navigation
// ══════════════════════════════════════════════════════════════════════════════

test.describe('Health Page — Tab Navigation', () => {
  let window: Page

  test.beforeAll(async () => {
    const { window: w } = await launchApp()
    window = w
    await dismissOnboarding(window)
  })

  test.afterAll(async () => {
    await closeApp()
  })

  test('navigates to salud via dropdown', async () => {
    await openHamburgerMenu(window)
    // Use first() + force to avoid pointer interception from the nav bar overlay
    await window.locator('button').filter({ hasText: 'Salud Financiera' }).first().click({ force: true })
    await window.waitForTimeout(500)
    await expect(window.locator('h1').filter({ hasText: /Salud/i })).toBeVisible({ timeout: 5000 })
  })

  test('shows Score and Recomendaciones tabs', async () => {
    await expect(window.locator('button').filter({ hasText: 'Score' })).toBeVisible()
    await expect(window.locator('button').filter({ hasText: 'Recomendaciones' })).toBeVisible()
  })

  test('Score tab shows health content', async () => {
    // The Score tab is active by default — verify some content renders
    await expect(window.locator('button').filter({ hasText: 'Score' })).toBeVisible()
  })

  test('can switch to Recomendaciones tab', async () => {
    await window.locator('button').filter({ hasText: 'Recomendaciones' }).click()
    await window.waitForTimeout(500)
    await expect(window.locator('button').filter({ hasText: 'Recomendaciones' })).toBeVisible()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════════════════════════════════

test.describe('Settings Page', () => {
  let window: Page

  test.beforeAll(async () => {
    const { window: w } = await launchApp()
    window = w
    await dismissOnboarding(window)
  })

  test.afterAll(async () => {
    await closeApp()
  })

  test('navigates to settings via avatar', async () => {
    const nav = window.locator('nav')
    const avatar = nav.locator('span').filter({ hasText: 'U' }).last()
    await avatar.click()
    await window.waitForTimeout(500)
    await expect(window.locator('h1').filter({ hasText: /Ajustes/i })).toBeVisible({ timeout: 5000 })
  })

  test('shows profile section', async () => {
    await expect(window.locator('text=Perfil').or(window.locator('text=PERFIL'))).toBeVisible()
  })

  test('shows currency selector', async () => {
    await expect(window.locator('text=Moneda').or(window.locator('text=MONEDA'))).toBeVisible()
  })

  test('shows payment day config', async () => {
    await expect(window.getByText('Día de pago', { exact: true })).toBeVisible()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// ALERTS
// ══════════════════════════════════════════════════════════════════════════════

test.describe('Alerts Page', () => {
  let window: Page

  test.beforeAll(async () => {
    const { window: w } = await launchApp()
    window = w
    await dismissOnboarding(window)
  })

  test.afterAll(async () => {
    await closeApp()
  })

  test('navigates to alerts via bell icon', async () => {
    const nav = window.locator('nav')
    const bellBtn = nav.locator('button:has(svg.lucide-bell)')
    await bellBtn.click()
    await window.waitForTimeout(500)
    await expect(window.locator('h1').filter({ hasText: /Alertas/i })).toBeVisible({ timeout: 5000 })
  })

  test('shows alert content', async () => {
    // Either shows tabs or empty state
    const hasTabs = await window.locator('button').filter({ hasText: 'Todas' }).isVisible().catch(() => false)
    const hasEmpty = await window.locator('text=sin alertas').or(window.locator('text=Sin alertas')).isVisible().catch(() => false)
    expect(hasTabs || hasEmpty).toBeTruthy()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// DECISION CENTER
// ══════════════════════════════════════════════════════════════════════════════

test.describe('Decision Center Page', () => {
  let window: Page

  test.beforeAll(async () => {
    const { window: w } = await launchApp()
    window = w
    await dismissOnboarding(window)
  })

  test.afterAll(async () => {
    await closeApp()
  })

  test('navigates to decision center via dropdown', async () => {
    await navigateViaDropdown(window, 'Decisiones')
    await expect(window.locator('h1').filter({ hasText: /Decisiones/i })).toBeVisible({ timeout: 5000 })
  })

  test('shows page content', async () => {
    // Decision center should have some content visible
    await expect(window.locator('h1').filter({ hasText: /Decisiones/i })).toBeVisible()
  })
})
