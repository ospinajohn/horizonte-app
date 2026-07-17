/**
 * Seed — Horizonte App
 * Datos de ejemplo para desarrollo
 */
import { PrismaClient } from '@prisma/client'
import { addDays, addMonths, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  console.log('🌱 Iniciando seed...')

  // ── Limpiar datos existentes ───────────────────────────────────────────────
  await prisma.alert.deleteMany()
  await prisma.savingsContribution.deleteMany()
  await prisma.savingsGoal.deleteMany()
  await prisma.budgetCategory.deleteMany()
  await prisma.budget.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.transfer.deleteMany()
  await prisma.recurringItem.deleteMany()
  await prisma.category.deleteMany()
  await prisma.account.deleteMany()
  await prisma.appConfig.deleteMany()

  // ── AppConfig ──────────────────────────────────────────────────────────────
  await prisma.appConfig.create({
    data: {
      userName: 'Usuario',
      currency: 'COP',
      language: 'es',
      theme: 'dark',
      weekStartDay: 1,
      payDay: 15,
      secondPayDay: 30,
      onboardingCompleted: false
    }
  })
  console.log('✅ AppConfig creada')

  // ── Categorías ────────────────────────────────────────────────────────────
  const incomeCategories = await prisma.category.createManyAndReturn({
    data: [
      { name: 'Salario', type: 'INCOME', icon: 'briefcase', color: '#22c55e', isDefault: true },
      { name: 'Freelance', type: 'INCOME', icon: 'laptop', color: '#3b82f6', isDefault: true },
      { name: 'Bonificación', type: 'INCOME', icon: 'gift', color: '#a855f7', isDefault: true },
      { name: 'Comisiones', type: 'INCOME', icon: 'percent', color: '#f59e0b', isDefault: true },
      { name: 'Dividendos', type: 'INCOME', icon: 'trending-up', color: '#06b6d4', isDefault: true },
      { name: 'Intereses', type: 'INCOME', icon: 'piggy-bank', color: '#84cc16', isDefault: true },
      { name: 'Otros ingresos', type: 'INCOME', icon: 'plus-circle', color: '#6b7280', isDefault: true }
    ]
  })

  const expenseCategories = await prisma.category.createManyAndReturn({
    data: [
      { name: 'Vivienda', type: 'EXPENSE', icon: 'home', color: '#f97316', isDefault: true },
      { name: 'Alimentación', type: 'EXPENSE', icon: 'utensils', color: '#eab308', isDefault: true },
      { name: 'Transporte', type: 'EXPENSE', icon: 'car', color: '#3b82f6', isDefault: true },
      { name: 'Salud', type: 'EXPENSE', icon: 'heart-pulse', color: '#ef4444', isDefault: true },
      { name: 'Educación', type: 'EXPENSE', icon: 'graduation-cap', color: '#8b5cf6', isDefault: true },
      { name: 'Tecnología', type: 'EXPENSE', icon: 'monitor', color: '#06b6d4', isDefault: true },
      { name: 'Entretenimiento', type: 'EXPENSE', icon: 'tv', color: '#ec4899', isDefault: true },
      { name: 'Mascotas', type: 'EXPENSE', icon: 'paw-print', color: '#f59e0b', isDefault: true },
      { name: 'Impuestos', type: 'EXPENSE', icon: 'landmark', color: '#6b7280', isDefault: true },
      { name: 'Viajes', type: 'EXPENSE', icon: 'plane', color: '#14b8a6', isDefault: true },
      { name: 'Compras', type: 'EXPENSE', icon: 'shopping-bag', color: '#f43f5e', isDefault: true },
      { name: 'Suscripciones', type: 'EXPENSE', icon: 'repeat', color: '#a855f7', isDefault: true },
      { name: 'Otros gastos', type: 'EXPENSE', icon: 'more-horizontal', color: '#6b7280', isDefault: true }
    ]
  })
  console.log(`✅ ${incomeCategories.length + expenseCategories.length} categorías creadas`)

  const catByName = (name: string) =>
    [...incomeCategories, ...expenseCategories].find((c) => c.name === name)!

  // ── Cuentas ───────────────────────────────────────────────────────────────
  const cuentaBancolombia = await prisma.account.create({
    data: {
      name: 'Bancolombia',
      type: 'BANCO',
      initialBalance: 1_500_000,
      color: '#f59e0b',
      icon: 'building-2'
    }
  })

  const cuentaEfectivo = await prisma.account.create({
    data: {
      name: 'Efectivo',
      type: 'EFECTIVO',
      initialBalance: 200_000,
      color: '#22c55e',
      icon: 'banknote'
    }
  })

  const cuentaNequi = await prisma.account.create({
    data: {
      name: 'Nequi',
      type: 'NEQUI',
      initialBalance: 350_000,
      color: '#a855f7',
      icon: 'smartphone'
    }
  })

  const cuentaAhorros = await prisma.account.create({
    data: {
      name: 'Cuenta de Ahorros',
      type: 'AHORROS',
      initialBalance: 2_000_000,
      color: '#3b82f6',
      icon: 'piggy-bank',
      isEmergencyFund: true
    }
  })
  console.log('✅ 4 cuentas creadas')

  // ── Items recurrentes ─────────────────────────────────────────────────────
  const today = new Date()
  const nextPayDay15 = new Date(today.getFullYear(), today.getMonth(), 15)
  if (nextPayDay15 < today) nextPayDay15.setMonth(nextPayDay15.getMonth() + 1)

  const nextPayDay30 = new Date(today.getFullYear(), today.getMonth(), 30)
  if (nextPayDay30 < today) nextPayDay30.setMonth(nextPayDay30.getMonth() + 1)

  const salarioRecurring = await prisma.recurringItem.create({
    data: {
      name: 'Salario quincenal',
      type: 'INCOME',
      amount: 1_750_000,
      recurrence: 'BIWEEKLY',
      nextDate: nextPayDay15,
      categoryId: catByName('Salario').id,
      accountId: cuentaBancolombia.id,
      description: 'Pago de nómina'
    }
  })

  const arriendoRecurring = await prisma.recurringItem.create({
    data: {
      name: 'Arriendo',
      type: 'EXPENSE',
      amount: 850_000,
      recurrence: 'MONTHLY',
      nextDate: new Date(today.getFullYear(), today.getMonth() + 1, 1),
      categoryId: catByName('Vivienda').id,
      accountId: cuentaBancolombia.id,
      description: 'Pago mensual de arriendo'
    }
  })

  await prisma.recurringItem.create({
    data: {
      name: 'Servicios públicos',
      type: 'EXPENSE',
      amount: 180_000,
      recurrence: 'MONTHLY',
      nextDate: new Date(today.getFullYear(), today.getMonth() + 1, 5),
      categoryId: catByName('Vivienda').id,
      accountId: cuentaBancolombia.id,
      description: 'Luz, agua, gas'
    }
  })

  await prisma.recurringItem.create({
    data: {
      name: 'Netflix',
      type: 'EXPENSE',
      amount: 23_900,
      recurrence: 'MONTHLY',
      nextDate: new Date(today.getFullYear(), today.getMonth() + 1, 10),
      categoryId: catByName('Suscripciones').id,
      accountId: cuentaBancolombia.id
    }
  })

  await prisma.recurringItem.create({
    data: {
      name: 'Spotify',
      type: 'EXPENSE',
      amount: 16_900,
      recurrence: 'MONTHLY',
      nextDate: new Date(today.getFullYear(), today.getMonth() + 1, 10),
      categoryId: catByName('Suscripciones').id,
      accountId: cuentaBancolombia.id
    }
  })

  await prisma.recurringItem.create({
    data: {
      name: 'Internet',
      type: 'EXPENSE',
      amount: 65_000,
      recurrence: 'MONTHLY',
      nextDate: addDays(today, 5),
      categoryId: catByName('Tecnología').id,
      accountId: cuentaBancolombia.id
    }
  })
  console.log('✅ 6 items recurrentes creados')

  // ── Transacciones del mes actual ──────────────────────────────────────────
  const monthStart = startOfMonth(today)

  // Ingresos
  await prisma.transaction.create({
    data: {
      type: 'INCOME',
      amount: 1_750_000,
      date: new Date(today.getFullYear(), today.getMonth(), 1),
      description: 'Salario primera quincena',
      accountId: cuentaBancolombia.id,
      categoryId: catByName('Salario').id,
      recurringItemId: salarioRecurring.id,
      isRecurring: true
    }
  })

  if (today.getDate() > 15) {
    await prisma.transaction.create({
      data: {
        type: 'INCOME',
        amount: 1_750_000,
        date: new Date(today.getFullYear(), today.getMonth(), 15),
        description: 'Salario segunda quincena',
        accountId: cuentaBancolombia.id,
        categoryId: catByName('Salario').id,
        recurringItemId: salarioRecurring.id,
        isRecurring: true
      }
    })
  }

  // Gastos del mes
  const gastosEjemplo = [
    { amount: 850_000, day: 1, desc: 'Arriendo', cat: 'Vivienda', method: 'TRANSFER', recurring: arriendoRecurring.id },
    { amount: 145_000, day: 2, desc: 'Mercado semanal', cat: 'Alimentación', method: 'DEBIT', recurring: null },
    { amount: 35_000, day: 3, desc: 'Bus/metro', cat: 'Transporte', method: 'CASH', recurring: null },
    { amount: 180_000, day: 5, desc: 'Servicios públicos', cat: 'Vivienda', method: 'TRANSFER', recurring: null },
    { amount: 65_000, day: 6, desc: 'Internet hogar', cat: 'Tecnología', method: 'DEBIT', recurring: null },
    { amount: 25_000, day: 7, desc: 'Domicilio comida', cat: 'Alimentación', method: 'DEBIT', recurring: null },
    { amount: 120_000, day: 8, desc: 'Mercado', cat: 'Alimentación', method: 'DEBIT', recurring: null },
    { amount: 23_900, day: 10, desc: 'Netflix', cat: 'Suscripciones', method: 'DEBIT', recurring: null },
    { amount: 16_900, day: 10, desc: 'Spotify', cat: 'Suscripciones', method: 'DEBIT', recurring: null },
    { amount: 45_000, day: 11, desc: 'Gasolina', cat: 'Transporte', method: 'CASH', recurring: null },
    { amount: 85_000, day: 12, desc: 'Restaurante', cat: 'Alimentación', method: 'DEBIT', recurring: null },
    { amount: 200_000, day: 14, desc: 'Ropa', cat: 'Compras', method: 'DEBIT', recurring: null }
  ].filter((g) => g.day <= today.getDate())

  for (const g of gastosEjemplo) {
    await prisma.transaction.create({
      data: {
        type: 'EXPENSE',
        amount: g.amount,
        date: new Date(today.getFullYear(), today.getMonth(), g.day),
        description: g.desc,
        accountId: cuentaBancolombia.id,
        categoryId: catByName(g.cat).id,
        paymentMethod: g.method,
        recurringItemId: g.recurring ?? undefined
      }
    })
  }

  // Gastos en efectivo
  await prisma.transaction.create({
    data: {
      type: 'EXPENSE',
      amount: 15_000,
      date: subDays(today, 2),
      description: 'Tinto y algo',
      accountId: cuentaEfectivo.id,
      categoryId: catByName('Alimentación').id,
      paymentMethod: 'CASH'
    }
  })

  // Gastos en Nequi
  await prisma.transaction.create({
    data: {
      type: 'EXPENSE',
      amount: 55_000,
      date: subDays(today, 1),
      description: 'Pago amigo',
      accountId: cuentaNequi.id,
      categoryId: catByName('Otros gastos').id,
      paymentMethod: 'TRANSFER'
    }
  })
  console.log('✅ Transacciones del mes creadas')

  // ── Transacciones de meses anteriores (para analítica) ─────────────────────
  for (let m = 1; m <= 3; m++) {
    const mesAnterior = subMonths(monthStart, m)

    // Ingreso salario
    await prisma.transaction.create({
      data: {
        type: 'INCOME',
        amount: 3_500_000,
        date: new Date(mesAnterior.getFullYear(), mesAnterior.getMonth(), 1),
        description: `Salario mes ${m} anterior`,
        accountId: cuentaBancolombia.id,
        categoryId: catByName('Salario').id,
        isRecurring: true
      }
    })

    // Gastos variados
    const gastosHistoricos = [
      { amount: 850_000, day: 1, cat: 'Vivienda', method: 'TRANSFER' },
      { amount: 280_000, day: 5, cat: 'Alimentación', method: 'DEBIT' },
      { amount: 180_000, day: 5, cat: 'Vivienda', method: 'TRANSFER' },
      { amount: 65_000, day: 6, cat: 'Tecnología', method: 'DEBIT' },
      { amount: 90_000, day: 8, cat: 'Transporte', method: 'CASH' },
      { amount: 150_000 + m * 20_000, day: 12, cat: 'Alimentación', method: 'DEBIT' },
      { amount: 60_000, day: 15, cat: 'Entretenimiento', method: 'DEBIT' },
      { amount: 40_900, day: 10, cat: 'Suscripciones', method: 'DEBIT' }
    ]

    for (const g of gastosHistoricos) {
      await prisma.transaction.create({
        data: {
          type: 'EXPENSE',
          amount: g.amount,
          date: new Date(mesAnterior.getFullYear(), mesAnterior.getMonth(), g.day),
          description: `Gasto histórico`,
          accountId: cuentaBancolombia.id,
          categoryId: catByName(g.cat).id,
          paymentMethod: g.method
        }
      })
    }
  }
  console.log('✅ Historial de 3 meses anteriores creado')

  // ── Presupuesto del mes actual ────────────────────────────────────────────
  const budget = await prisma.budget.create({
    data: {
      name: `Presupuesto ${today.toLocaleString('es-CO', { month: 'long', year: 'numeric' })}`,
      period: 'MONTHLY',
      startDate: startOfMonth(today),
      endDate: endOfMonth(today),
      isActive: true
    }
  })

  const budgetCats = [
    { cat: 'Alimentación', limit: 500_000 },
    { cat: 'Transporte', limit: 250_000 },
    { cat: 'Entretenimiento', limit: 150_000 },
    { cat: 'Compras', limit: 300_000 },
    { cat: 'Salud', limit: 200_000 },
    { cat: 'Suscripciones', limit: 100_000 }
  ]

  for (const bc of budgetCats) {
    await prisma.budgetCategory.create({
      data: {
        budgetId: budget.id,
        categoryId: catByName(bc.cat).id,
        limit: bc.limit
      }
    })
  }
  console.log('✅ Presupuesto del mes creado con 6 categorías')

  // ── Metas de ahorro ───────────────────────────────────────────────────────
  const metaViaje = await prisma.savingsGoal.create({
    data: {
      name: 'Viaje a Cartagena',
      targetAmount: 3_000_000,
      currentAmount: 800_000,
      deadline: addMonths(today, 4),
      priority: 'HIGH',
      icon: 'plane',
      color: '#14b8a6',
      monthlyTarget: 550_000,
      accountId: cuentaAhorros.id
    }
  })

  await prisma.savingsContribution.createMany({
    data: [
      { goalId: metaViaje.id, amount: 400_000, date: subMonths(today, 1), notes: 'Primer aporte' },
      { goalId: metaViaje.id, amount: 400_000, date: subDays(today, 15), notes: 'Aporte quincena' }
    ]
  })

  const metaEmergencia = await prisma.savingsGoal.create({
    data: {
      name: 'Fondo de Emergencia',
      targetAmount: 6_000_000,
      currentAmount: 2_000_000,
      priority: 'HIGH',
      icon: 'shield',
      color: '#ef4444',
      monthlyTarget: 400_000,
      accountId: cuentaAhorros.id
    }
  })

  await prisma.savingsContribution.create({
    data: {
      goalId: metaEmergencia.id,
      amount: 2_000_000,
      date: subMonths(today, 2),
      notes: 'Aporte inicial'
    }
  })

  await prisma.savingsGoal.create({
    data: {
      name: 'Computador nuevo',
      targetAmount: 4_500_000,
      currentAmount: 500_000,
      deadline: addMonths(today, 8),
      priority: 'MEDIUM',
      icon: 'monitor',
      color: '#3b82f6',
      monthlyTarget: 500_000,
      accountId: cuentaAhorros.id
    }
  })
  console.log('✅ 3 metas de ahorro creadas')

  // ── Transferencia de ejemplo ───────────────────────────────────────────────
  await prisma.transfer.create({
    data: {
      amount: 100_000,
      date: subDays(today, 3),
      description: 'Recarga Nequi',
      fromAccountId: cuentaBancolombia.id,
      toAccountId: cuentaNequi.id
    }
  })
  console.log('✅ Transferencia de ejemplo creada')

  // ── Alertas de ejemplo ────────────────────────────────────────────────────
  await prisma.alert.createMany({
    data: [
      {
        type: 'PAYMENT_DUE',
        severity: 'WARNING',
        title: 'Pago próximo',
        message: 'El arriendo vence en 3 días ($850.000)',
        isRead: false
      },
      {
        type: 'BUDGET_WARNING',
        severity: 'WARNING',
        title: 'Presupuesto Alimentación al 85%',
        message: 'Has usado $425.000 de tu presupuesto de Alimentación ($500.000)',
        isRead: false
      },
      {
        type: 'PAYMENT_DUE',
        severity: 'INFO',
        title: 'Recordatorio Internet',
        message: 'El pago de Internet vence en 5 días ($65.000)',
        isRead: true
      }
    ]
  })
  console.log('✅ 3 alertas de ejemplo creadas')

  // ── Resumen ────────────────────────────────────────────────────────────────
  const counts = {
    config: await prisma.appConfig.count(),
    accounts: await prisma.account.count(),
    categories: await prisma.category.count(),
    transactions: await prisma.transaction.count(),
    recurringItems: await prisma.recurringItem.count(),
    budgets: await prisma.budget.count(),
    savingsGoals: await prisma.savingsGoal.count(),
    alerts: await prisma.alert.count()
  }

  console.log('\n📊 Resumen del seed:')
  console.table(counts)
  console.log('\n✅ Seed completado exitosamente')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
