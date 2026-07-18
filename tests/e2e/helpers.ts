import { _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import { join } from 'path'

let electronApp: ElectronApplication

/**
 * Launch the Electron app from the built output.
 * Must run `npm run build` before running E2E tests.
 */
export async function launchApp(): Promise<{ app: ElectronApplication; window: Page }> {
  electronApp = await electron.launch({
    args: [join(__dirname, '..', '..', 'out', 'main', 'index.js')],
  })

  const window = await electronApp.firstWindow()
  await window.waitForLoadState('domcontentloaded')
  await window.waitForTimeout(3000)

  return { app: electronApp, window }
}

export async function closeApp(): Promise<void> {
  if (electronApp) {
    await electronApp.close()
  }
}

/**
 * Wait for Dashboard to fully render.
 */
export async function waitForDashboard(window: Page): Promise<void> {
  await window.waitForSelector('text=Financial Command Center', { timeout: 15000 })
}

/**
 * Open the hamburger menu and navigate to a grouped nav item.
 */
export async function openMenuAndNavigate(window: Page, groupLabel: string, itemLabel: string): Promise<void> {
  // Click the hamburger (Menu) button to open the dropdown
  const menuButton = window.locator('button').filter({ has: window.locator('svg.lucide-menu') })
  await menuButton.click()
  await window.waitForTimeout(300)

  // Find the group heading, then click the item inside it
  const group = window.locator('div').filter({ hasText: new RegExp(`^${groupLabel}$`) }).last()
  const item = group.locator('button').filter({ hasText: itemLabel })
  await item.click()
  await window.waitForTimeout(500)
}

/**
 * Navigate via the main visible nav links.
 */
export async function navigateViaMainNav(window: Page, label: string): Promise<void> {
  const nav = window.locator('nav')
  const link = nav.locator('button').filter({ hasText: label }).first()
  await link.click()
  await window.waitForTimeout(500)
}
