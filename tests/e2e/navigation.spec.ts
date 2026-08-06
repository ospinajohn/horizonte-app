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
  // The hamburger Menu button is the only <button> inside a div.relative inside nav
  const menuBtn = window.locator('nav .relative button')
  await menuBtn.click()
  await window.waitForTimeout(400)
}

test.describe('Navigation — Main Nav Links', () => {
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

  test('Dashboard is the default view', async () => {
    await expect(window.locator('text=Financial Command Center')).toBeVisible()
  })

  test('navigate to Cuentas via main nav', async () => {
    const nav = window.locator('nav')
    await nav.locator('button').filter({ hasText: 'Cuentas' }).click()
    await window.waitForTimeout(500)
    await expect(window.locator('h1').filter({ hasText: 'Cuentas' })).toBeVisible({ timeout: 5000 })
  })

  test('navigate to Transacciones via main nav', async () => {
    const nav = window.locator('nav')
    await nav.locator('button').filter({ hasText: 'Transacciones' }).click()
    await window.waitForTimeout(500)
    await expect(window.locator('h1').filter({ hasText: 'Transacciones' })).toBeVisible({ timeout: 5000 })
  })

  test('navigate to Reportes via main nav', async () => {
    const nav = window.locator('nav')
    await nav.locator('button').filter({ hasText: 'Reportes' }).click()
    await window.waitForTimeout(500)
    await expect(window.locator('h1').filter({ hasText: 'Reportes' })).toBeVisible({ timeout: 5000 })
  })

  test('navigate back to Dashboard via logo', async () => {
    const nav = window.locator('nav')
    await nav.locator('text=HORIZONTE').click()
    await window.waitForTimeout(500)
    await expect(window.locator('text=Financial Command Center')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Navigation — Dropdown Menu', () => {
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

  test('hamburger menu opens and shows grouped categories', async () => {
    await openHamburgerMenu(window)
    await expect(window.locator('text=Créditos').last()).toBeVisible({ timeout: 3000 })
    await expect(window.locator('text=Inteligencia').last()).toBeVisible()
  })

  test('navigate to Créditos via dropdown', async () => {
    const menuItem = window.locator('button').filter({ hasText: 'Créditos' }).last()
    await menuItem.click()
    await window.waitForTimeout(500)
    await expect(window.locator('h1').filter({ hasText: /Crédito/i })).toBeVisible({ timeout: 5000 })
  })

  test('navigate to Laboratorio via dropdown', async () => {
    await openHamburgerMenu(window)
    const menuItem = window.locator('button').filter({ hasText: 'Laboratorio' }).last()
    await menuItem.click()
    await window.waitForTimeout(500)
    await expect(window.locator('h1').filter({ hasText: /Laboratorio/i })).toBeVisible({ timeout: 5000 })
  })

  test('navigate to Salud via dropdown', async () => {
    await openHamburgerMenu(window)
    const menuItem = window.locator('button').filter({ hasText: 'Salud Financiera' }).last()
    await menuItem.click()
    await window.waitForTimeout(500)
    await expect(window.locator('h1').filter({ hasText: /Salud/i })).toBeVisible({ timeout: 5000 })
  })

  test('navigate to Decisiones via dropdown', async () => {
    await openHamburgerMenu(window)
    const menuItem = window.locator('button').filter({ hasText: 'Decisiones' }).last()
    await menuItem.click()
    await window.waitForTimeout(500)
    await expect(window.locator('h1').filter({ hasText: /Decisiones/i })).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Navigation — Via Avatar to Settings', () => {
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

  test('navigate to Configuración via avatar', async () => {
    const nav = window.locator('nav')
    // The avatar is a div with "U" text at the end of the nav
    const avatar = nav.locator('span').filter({ hasText: 'U' }).last()
    await avatar.click()
    await window.waitForTimeout(500)
    await expect(window.locator('h1').filter({ hasText: /Ajustes/i })).toBeVisible({ timeout: 5000 })
  })
})
