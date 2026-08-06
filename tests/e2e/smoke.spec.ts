import { test, expect, type Page } from '@playwright/test'
import { launchApp, closeApp } from './helpers'

test.describe('Horizonte App — Smoke Test', () => {
  let window: Page

  test.beforeAll(async () => {
    const { window: w } = await launchApp()
    window = w
  })

  test.afterAll(async () => {
    await closeApp()
  })

  test('window opens and has correct title', async () => {
    const title = await window.title()
    expect(title).toBeTruthy()
  })

  test('onboarding or dashboard renders', async () => {
    // The app either shows onboarding or dashboard depending on config
    const hasOnboarding = await window.locator('text=Horizonte').first().isVisible().catch(() => false)
    const hasDashboard = await window.locator('text=Financial Command Center').isVisible().catch(() => false)
    expect(hasOnboarding || hasDashboard).toBeTruthy()
  })
})

test.describe('Onboarding Flow', () => {
  let window: Page

  test.beforeAll(async () => {
    const { window: w } = await launchApp()
    window = w
  })

  test.afterAll(async () => {
    await closeApp()
  })

  test('can complete onboarding steps', async () => {
    // Step 1: Welcome — look for the first step or name input
    const step1Visible = await window.locator('text=Nombre').first().isVisible().catch(() => false)
    if (!step1Visible) {
      // Onboarding already completed, skip
      await window.waitForSelector('text=Financial Command Center', { timeout: 10000 })
      return
    }

    // Fill name
    const nameInput = window.locator('input').first()
    await nameInput.fill('Test User')

    // Click continue button
    const continueBtn = window.locator('button').filter({ hasText: /continuar|siguiente|next/i }).first()
    if (await continueBtn.isVisible()) {
      await continueBtn.click()
      await window.waitForTimeout(500)
    }

    // Step 2: Currency & Payday
    const step2Visible = await window.locator('text=Moneda').first().isVisible().catch(() => false)
    if (step2Visible) {
      const continueBtn2 = window.locator('button').filter({ hasText: /continuar|siguiente|next/i }).first()
      if (await continueBtn2.isVisible()) {
        await continueBtn2.click()
        await window.waitForTimeout(500)
      }
    }

    // Step 3: Account
    const step3Visible = await window.locator('text=Cuenta').first().isVisible().catch(() => false)
    if (step3Visible) {
      const accountInput = window.locator('input').first()
      await accountInput.fill('Cuenta Test')
      const continueBtn3 = window.locator('button').filter({ hasText: /continuar|siguiente|next/i }).first()
      if (await continueBtn3.isVisible()) {
        await continueBtn3.click()
        await window.waitForTimeout(500)
      }
    }

    // Step 4: Income
    const step4Visible = await window.locator('text=Ingreso').first().isVisible().catch(() => false)
    if (step4Visible) {
      const continueBtn4 = window.locator('button').filter({ hasText: /continuar|siguiente|next/i }).first()
      if (await continueBtn4.isVisible()) {
        await continueBtn4.click()
        await window.waitForTimeout(500)
      }
    }

    // Final: "Ir al Dashboard"
    const finishBtn = window.locator('button').filter({ hasText: /ir al dashboard/i }).first()
    if (await finishBtn.isVisible()) {
      await finishBtn.click()
      await window.waitForTimeout(1000)
    }

    // Dashboard should now be visible
    await window.waitForSelector('text=Financial Command Center', { timeout: 10000 })
  })
})
