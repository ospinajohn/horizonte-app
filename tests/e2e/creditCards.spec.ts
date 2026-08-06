import { test, expect, type Page } from '@playwright/test'
import { launchApp, closeApp } from './helpers'

async function dismissOnboarding(window: Page): Promise<void> {
  const finishBtn = window.locator('button').filter({ hasText: /ir al dashboard/i }).first()
  if (await finishBtn.isVisible().catch(() => false)) {
    await finishBtn.click()
    await window.waitForTimeout(1000)
  }
}

async function navigateViaDropdown(window: Page, itemLabel: string): Promise<void> {
  const menuBtn = window.locator('nav .relative button')
  await menuBtn.click()
  await window.waitForTimeout(400)
  await window.locator('button').filter({ hasText: itemLabel }).last().click()
  await window.waitForTimeout(500)
}

test.describe('Credit Cards — Intelligence MVP', () => {
  let window: Page
  const consoleErrors: string[] = []

  test.beforeAll(async () => {
    const { window: w } = await launchApp()
    window = w
    window.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    await dismissOnboarding(window)
  })

  test.afterAll(async () => {
    await closeApp()
  })

  test('navigate to Tarjetas', async () => {
    await navigateViaDropdown(window, 'Tarjetas')
    await expect(window.locator('h1').filter({ hasText: 'Tarjetas de Crédito' })).toBeVisible({ timeout: 5000 })
  })

  test('create a card with benefits and see status badge', async () => {
    await window.locator('button').filter({ hasText: 'Nueva Tarjeta' }).click()
    await window.waitForSelector('text=Nueva Tarjeta', { timeout: 5000 })

    await window.locator('input[placeholder="Visa Infinite"]').fill('Tarjeta E2E Test')
    await window.locator('input[placeholder="Bancolombia"]').fill('Banco E2E')
    await window.locator('input[placeholder="5000000"]').fill('3000000')
    await window.locator('input[placeholder="25"]').fill('20')
    await window.locator('input[placeholder="10"]').fill('5')
    await window.locator('input[placeholder="Visa, Mastercard..."]').fill('Visa')
    await window.locator('input[placeholder="1.5"]').fill('2')
    await window.locator('input[placeholder="supermercados, restaurantes"]').fill('supermercados')

    await window.locator('button[type="submit"]').filter({ hasText: 'Guardar' }).click()
    await window.waitForTimeout(1500)

    const cardExists = await window.locator('text=Tarjeta E2E Test').first().isVisible().catch(() => false)
    expect(cardExists).toBeTruthy()

    // El badge de estado (inteligencia) debe renderizar sin explotar la UI
    const badgeVisible = await window
      .locator('text=/Excelente momento|Buen momento|Momento normal|Evita comprar/')
      .first()
      .isVisible()
      .catch(() => false)
    expect(badgeVisible).toBeTruthy()
  })

  test('purchase assistant returns a recommendation', async () => {
    await window.locator('button').filter({ hasText: 'Asistente de compras' }).click()
    await window.waitForSelector('text=Asistente de compras', { timeout: 5000 })

    await window.locator('input[placeholder="Monto de la compra"]').fill('100000')
    await window.locator('button[type="submit"]').filter({ hasText: 'Analizar' }).click()
    await window.waitForTimeout(1000)

    const hasReason = await window.locator('text=/días para pagar sin intereses/').first().isVisible().catch(() => false)
    expect(hasReason).toBeTruthy()

    await window.keyboard.press('Escape')
    await window.waitForTimeout(300)
  })

  test('no hubo errores de consola durante el flujo de tarjetas', () => {
    const relevant = consoleErrors.filter((e) => !e.includes('DevTools') && !e.includes('Autofill'))
    expect(relevant).toEqual([])
  })

  test('delete the test card', async () => {
    // El comparador y la tarjeta comparten estilos y ambos contienen el nombre de la
    // tarjeta de prueba — se ancla por el botón "Eliminar" (solo existe en la tarjeta).
    const deleteBtn = window
      .locator('[class*="rounded-[28px]"]')
      .filter({ hasText: 'Tarjeta E2E Test' })
      .filter({ has: window.locator('button', { hasText: 'Eliminar' }) })
      .locator('button')
      .filter({ hasText: 'Eliminar' })

    await expect(deleteBtn).toBeVisible({ timeout: 5000 })
    await deleteBtn.click()
    await window.waitForTimeout(1000)

    const stillVisible = await window.locator('text=Tarjeta E2E Test').first().isVisible().catch(() => false)
    expect(stillVisible).toBeFalsy()
  })
})
