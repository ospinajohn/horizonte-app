import { describe, it, expect } from 'vitest'
import { Prisma } from '@prisma/client'
import { wrapService } from './wrapService'

describe('wrapService', () => {
  it('retorna success:true con la data cuando la función resuelve', async () => {
    const result = await wrapService(async () => 42)
    expect(result).toEqual({ success: true, data: 42 })
  })

  it('retorna success:false con el mensaje cuando lanza un Error genérico', async () => {
    const result = await wrapService(async () => {
      throw new Error('Cuenta no encontrada')
    })
    expect(result).toEqual({ success: false, error: 'Cuenta no encontrada' })
  })

  it('traduce P2002 (unique constraint) a un mensaje amigable con el campo', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '5.22.0',
      meta: { target: ['name'] }
    })
    const result = await wrapService(async () => {
      throw error
    })
    expect(result.success).toBe(false)
    expect(result.error).toContain('name')
  })

  it('traduce P2025 (registro no encontrado) a un mensaje amigable', async () => {
    const error = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '5.22.0'
    })
    const result = await wrapService(async () => {
      throw error
    })
    expect(result.error).toBe('El registro no existe o ya fue eliminado')
  })
})
