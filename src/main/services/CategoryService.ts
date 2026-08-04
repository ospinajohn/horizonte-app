import { getPrismaClient } from '../database/client'
import type { Category, CategoryType, ApiResult } from '../../shared/types'

const db = () => getPrismaClient()

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salario', type: 'INCOME' as const, icon: 'briefcase', color: '#22c55e' },
  { name: 'Freelance', type: 'INCOME' as const, icon: 'laptop', color: '#3b82f6' },
  { name: 'Bonificación', type: 'INCOME' as const, icon: 'gift', color: '#a855f7' },
  { name: 'Comisiones', type: 'INCOME' as const, icon: 'percent', color: '#f59e0b' },
  { name: 'Dividendos', type: 'INCOME' as const, icon: 'trending-up', color: '#06b6d4' },
  { name: 'Intereses', type: 'INCOME' as const, icon: 'piggy-bank', color: '#84cc16' },
  { name: 'Otros ingresos', type: 'INCOME' as const, icon: 'plus-circle', color: '#6b7280' }
]

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Vivienda', type: 'EXPENSE' as const, icon: 'home', color: '#f97316' },
  { name: 'Alimentación', type: 'EXPENSE' as const, icon: 'utensils', color: '#eab308' },
  { name: 'Transporte', type: 'EXPENSE' as const, icon: 'car', color: '#3b82f6' },
  { name: 'Salud', type: 'EXPENSE' as const, icon: 'heart-pulse', color: '#ef4444' },
  { name: 'Educación', type: 'EXPENSE' as const, icon: 'graduation-cap', color: '#8b5cf6' },
  { name: 'Tecnología', type: 'EXPENSE' as const, icon: 'monitor', color: '#06b6d4' },
  { name: 'Entretenimiento', type: 'EXPENSE' as const, icon: 'tv', color: '#ec4899' },
  { name: 'Mascotas', type: 'EXPENSE' as const, icon: 'paw-print', color: '#f59e0b' },
  { name: 'Impuestos', type: 'EXPENSE' as const, icon: 'landmark', color: '#6b7280' },
  { name: 'Viajes', type: 'EXPENSE' as const, icon: 'plane', color: '#14b8a6' },
  { name: 'Compras', type: 'EXPENSE' as const, icon: 'shopping-bag', color: '#f43f5e' },
  { name: 'Suscripciones', type: 'EXPENSE' as const, icon: 'repeat', color: '#a855f7' },
  { name: 'Otros gastos', type: 'EXPENSE' as const, icon: 'more-horizontal', color: '#6b7280' }
]

export const CategoryService = {
  /**
   * Crea las categorías por defecto si la base de datos no tiene ninguna.
   * Protege contra el caso de una instalación/reset sin el seed de desarrollo,
   * donde los formularios (transacciones, presupuestos, etc.) quedarían sin
   * ninguna opción de categoría para elegir.
   */
  async ensureDefaults(): Promise<void> {
    const count = await db().category.count()
    if (count > 0) return
    await db().category.createMany({
      data: [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES].map((c) => ({
        ...c,
        isDefault: true
      }))
    })
  },

  async getAll(type?: CategoryType): Promise<ApiResult<Category[]>> {
    try {
      const categories = await db().category.findMany({
        where: {
          isActive: true,
          ...(type ? { type } : {})
        },
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }]
      })
      return { success: true, data: categories as Category[] }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  async getById(id: number): Promise<ApiResult<Category>> {
    try {
      const cat = await db().category.findUnique({ where: { id } })
      if (!cat) return { success: false, error: 'Categoría no encontrada' }
      return { success: true, data: cat as Category }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  async create(dto: {
    name: string
    type: CategoryType
    icon?: string
    color?: string
  }): Promise<ApiResult<Category>> {
    try {
      const cat = await db().category.create({ data: dto })
      return { success: true, data: cat as Category }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },

  async update(
    id: number,
    dto: Partial<{ name: string; icon: string; color: string; isActive: boolean }>
  ): Promise<ApiResult<Category>> {
    try {
      const cat = await db().category.update({ where: { id }, data: dto })
      return { success: true, data: cat as Category }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}
