import { app, BrowserWindow, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import { is } from '@electron-toolkit/utils'

export class UpdateService {
  private static mainWindow: BrowserWindow | null = null
  private static initialized = false

  static init(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow

    if (this.initialized) return
    this.initialized = true

    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = false

    autoUpdater.on('update-available', (info) => {
      this.send('updater:available', {
        version: info.version,
        releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : null
      })
    })

    autoUpdater.on('download-progress', (progress) => {
      this.send('updater:progress', { percent: Math.round(progress.percent) })
    })

    autoUpdater.on('update-downloaded', (info) => {
      this.send('updater:downloaded', { version: info.version })
    })

    autoUpdater.on('error', (error) => {
      this.send('updater:error', { message: error.message })
    })

    ipcMain.handle('updater:download', () => {
      autoUpdater.downloadUpdate()
    })

    ipcMain.handle('updater:install', () => {
      autoUpdater.quitAndInstall()
    })

    ipcMain.handle('updater:checkNow', () => this.check())
  }

  static check(): void {
    // Solo tiene sentido en la app empaquetada (necesita app-update.yml generado por electron-builder)
    if (is.dev || !app.isPackaged) return
    autoUpdater.checkForUpdates().catch((error) => {
      this.send('updater:error', { message: error.message })
    })
  }

  private static send(channel: string, payload: unknown): void {
    this.mainWindow?.webContents.send(channel, payload)
  }
}
