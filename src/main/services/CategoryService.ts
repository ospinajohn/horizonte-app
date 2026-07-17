import { getPrismaClient } from '../database/client'
import type { Category, CategoryType, ApiResult } from '../../shared/types'

const db = () => getPrismaClient()

export const CategoryService = {
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
