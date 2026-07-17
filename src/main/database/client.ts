/**
 * Prisma Client singleton para el main process
 * Maneja la ruta dinámica de la base de datos en producción (userData)
 * y la ruta de desarrollo (prisma/dev.db)
 */
import { PrismaClient } from '@prisma/client'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, copyFileSync } from 'fs'
import { is } from '@electron-toolkit/utils'

let prismaClient: PrismaClient | null = null

/**
 * Resuelve la ruta de la base de datos SQLite.
 * - Desarrollo: usa el dev.db de la carpeta prisma/
 * - Producción: usa userData/horizonte.db (persistente entre actualizaciones)
 */
function resolveDatabasePath(): string {
  if (is.dev) {
    return join(process.cwd(), 'prisma', 'dev.db')
  }

  const userDataPath = app.getPath('userData')
  const dbDir = join(userDataPath, 'database')
  const dbPath = join(dbDir, 'horizonte.db')

  // Crear directorio si no existe
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }

  // Si no existe la DB en userData, copiar la migración base desde resources
  if (!existsSync(dbPath)) {
    const basePath = join(process.resourcesPath, 'prisma', 'base.db')
    if (existsSync(basePath)) {
      copyFileSync(basePath, dbPath)
    }
  }

  return dbPath
}

/**
 * Retorna la instancia singleton de Prisma Client
 */
export function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    const dbPath = resolveDatabasePath()
    const databaseUrl = `file:${dbPath}`

    prismaClient = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl
        }
      },
      log: is.dev ? ['warn', 'error'] : ['error']
    })
  }

  return prismaClient
}

/**
 * Desconecta el cliente Prisma (llamar al cerrar la app)
 */
export async function disconnectDatabase(): Promise<void> {
  if (prismaClient) {
    await prismaClient.$disconnect()
    prismaClient = null
  }
}
