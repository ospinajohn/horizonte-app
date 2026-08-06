import { Prisma } from '@prisma/client'
import type { ApiResult } from '../../shared/types'

function mapPrismaError(error: any): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const field = Array.isArray(error.meta?.target)
      ? error.meta.target.join(', ')
      : error.meta?.target

    switch (error.code) {
      case 'P2002':
        return field
          ? `Ya existe un registro con ese valor en: ${field}`
          : 'Ya existe un registro con ese valor único'
      case 'P2003':
        return 'No se puede completar la operación: hay datos relacionados que dependen de este registro'
      case 'P2025':
        return 'El registro no existe o ya fue eliminado'
      default:
        return `Error de base de datos (${error.code})`
    }
  }

  return error?.message ?? 'Error desconocido'
}

/**
 * Envuelve una operación de servicio, capturando errores de Prisma y
 * traduciéndolos a mensajes legibles antes de propagarlos como ApiResult.
 */
export async function wrapService<T>(fn: () => Promise<T>): Promise<ApiResult<T>> {
  try {
    const data = await fn()
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: mapPrismaError(error) }
  }
}
