import { describe, it, expect } from 'vitest'
import { createAccountSchema, createTransactionSchema, validateDto } from './validation'

describe('validateDto', () => {
  it('acepta un DTO de cuenta válido', () => {
    const dto = validateDto(createAccountSchema, {
      name: 'Cuenta Bancolombia',
      type: 'BANCO',
      initialBalance: 100_000,
      color: '#10B981',
      icon: 'banco'
    })
    expect(dto.name).toBe('Cuenta Bancolombia')
  })

  it('rechaza saldo inicial negativo', () => {
    expect(() =>
      validateDto(createAccountSchema, {
        name: 'Cuenta X',
        type: 'BANCO',
        initialBalance: -500,
        color: '#10B981',
        icon: 'banco'
      })
    ).toThrow()
  })

  it('rechaza un tipo de cuenta no permitido (payload manipulado fuera del formulario)', () => {
    expect(() =>
      validateDto(createAccountSchema, {
        name: 'Cuenta X',
        type: 'CRYPTO_WALLET',
        initialBalance: 100,
        color: '#10B981',
        icon: 'banco'
      })
    ).toThrow()
  })

  it('rechaza un monto de transacción negativo o cero', () => {
    expect(() =>
      validateDto(createTransactionSchema, {
        type: 'EXPENSE',
        amount: 0,
        date: new Date(),
        accountId: 1
      })
    ).toThrow()
  })

  it('acepta una transacción válida y coerciona la fecha string a Date', () => {
    const dto = validateDto(createTransactionSchema, {
      type: 'EXPENSE',
      amount: 50_000,
      date: '2026-07-25',
      accountId: 1
    })
    expect(dto.date).toBeInstanceOf(Date)
  })
})
