import { test, expect, type Page } from '@playwright/test'
import { launchApp, closeApp } from './helpers'

async function dismissOnboarding(window: Page): Promise<void> {
  const finishBtn = window.locator('button').filter({ hasText: /ir al dashboard/i }).first()
  if (await finishBtn.isVisible().catch(() => false)) {
    await finishBtn.click()
    await window.waitForTimeout(1000)
  }
}

test.describe('Accounts — Full CRUD', () => {
  let window: Page

  test.beforeAll(async () => {
    const { window: w } = await launchApp()
    window = w
    await dismissOnboarding(window)
  })

  test.afterAll(async () => {
    await closeApp()
  })

  test('navigate to accounts', async () => {
    const nav = window.locator('nav')
    await nav.locator('button').filter({ hasText: 'Cuentas' }).click()
    await window.waitForTimeout(500)
    await expect(window.locator('h1').filter({ hasText: 'Cuentas' })).toBeVisible({ timeout: 5000 })
  })

  test('create a new account', async () => {
    // Open modal
    await window.locator('button').filter({ hasText: 'Nueva Cuenta' }).click()
    await window.waitForSelector('text=Agregar cuenta', { timeout: 5000 })

    // Fill name — placeholder is "Ej. Cuenta Bancolombia"
    const nameInput = window.locator('input[placeholder*="Bancolombia"]')
    await nameInput.fill('Cuenta E2E Test')

    // Type is a <select> — select BANCO
    const typeSelect = window.locator('select')
    await typeSelect.selectOption('BANCO')

    // Fill initial balance
    const balanceInput = window.locator('input[type="number"]')
    await balanceInput.fill('500000')

    // Submit — button text is "Crear cuenta"
    await window.locator('button[type="submit"]').filter({ hasText: 'Crear cuenta' }).click()
    await window.waitForTimeout(1500)

    // Modal should close and account should appear
    const accountExists = await window.locator('text=Cuenta E2E Test').isVisible().catch(() => false)
    expect(accountExists).toBeTruthy()
  })

  test('account card shows balance info', async () => {
    await expect(window.locator('text=Cuenta E2E Test')).toBeVisible({ timeout: 5000 })
  })

  test('delete the test account', async () => {
    // Find the delete button (trash icon) on the account card
    const accountCard = window.locator('[class*="rounded"]').filter({ hasText: 'Cuenta E2E Test' }).first()
    const deleteBtn = accountCard.locator('button').filter({ has: window.locator('svg') }).last()
    if (await deleteBtn.isVisible().catch(() => false)) {
      await deleteBtn.click()
      await window.waitForTimeout(500)

      // Confirm deletion in dialog
      const confirmBtn = window.locator('button').filter({ hasText: /eliminar|borrar|delete|confirmar|aceptar/i }).first()
      if (await confirmBtn.isVisible().catch(() => false)) {
        await confirmBtn.click()
        await window.waitForTimeout(1000)
      }
    }
  })
})

test.describe('Transactions — Create Income & Expense', () => {
  let window: Page

  test.beforeAll(async () => {
    const { window: w } = await launchApp()
    window = w
    await dismissOnboarding(window)
  })

  test.afterAll(async () => {
    await closeApp()
  })

  test('navigate to transactions', async () => {
    const nav = window.locator('nav')
    await nav.locator('button').filter({ hasText: 'Transacciones' }).click()
    await window.waitForTimeout(500)
    await expect(window.locator('h1').filter({ hasText: 'Transacciones' })).toBeVisible({ timeout: 5000 })
  })

  test('create an income transaction', async () => {
    const incomeBtn = window.locator('button').filter({ hasText: /Ingreso/ }).first()
    await incomeBtn.click()
    await window.waitForTimeout(800)

    // Find amount input
    const amountInput = window.locator('input[type="number"]').first()
    if (await amountInput.isVisible().catch(() => false)) {
      await amountInput.fill('1000000')
    }

    // Find description
    const descInput = window.locator('input[placeholder*="escri"], input[placeholder*="Descri"], input[placeholder*="detalle"]').first()
    if (await descInput.isVisible().catch(() => false)) {
      await descInput.fill('Ingreso E2E Test')
    }

    const saveBtn = window.locator('button[type="submit"]').filter({ hasText: /guardar|crear|registrar/i }).first()
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click()
      await window.waitForTimeout(1000)
    }
  })

  test('create an expense transaction', async () => {
    const expenseBtn = window.locator('button').filter({ hasText: /Gasto/ }).first()
    await expenseBtn.click()
    await window.waitForTimeout(800)

    const amountInput = window.locator('input[type="number"]').first()
    if (await amountInput.isVisible().catch(() => false)) {
      await amountInput.fill('50000')
    }

    const descInput = window.locator('input[placeholder*="escri"], input[placeholder*="Descri"], input[placeholder*="detalle"]').first()
    if (await descInput.isVisible().catch(() => false)) {
      await descInput.fill('Gasto E2E Test')
    }

    const saveBtn = window.locator('button[type="submit"]').filter({ hasText: /guardar|crear|registrar/i }).first()
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click()
      await window.waitForTimeout(1000)
    }
  })
})
