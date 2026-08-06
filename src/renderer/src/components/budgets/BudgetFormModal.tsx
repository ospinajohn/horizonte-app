import { useState, useEffect } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { z } from 'zod'
import { parseLocalDate } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Plus, Trash2 } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useCategories } from '../../hooks/useCategories'
import { Button } from '../ui/button'
import { Input, DatePicker } from '../ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select'
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns'

const budgetSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  period: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']),
  startDate: z.string().min(1, 'Fecha inicio requerida'),
  endDate: z.string().min(1, 'Fecha fin requerida'),
  categories: z.array(
    z.object({
      categoryId: z.number().min(1, 'Selecciona una categoría'),
      limit: z.number().min(1, 'Debe ser mayor a 0')
    })
  ).min(1, 'Agrega al menos una categoría al presupuesto')
})

type BudgetFormValues = z.infer<typeof budgetSchema>

export function BudgetFormModal({ onSuccess }: { onSuccess: () => void }): JSX.Element | null {
  const { activeModal, closeModal } = useAppStore()
  const { categories } = useCategories('EXPENSE')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isOpen = activeModal?.type === 'create-budget'

  const { register, control, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: `Presupuesto ${format(new Date(), 'MMMM yyyy')}`,
      period: 'MONTHLY',
      startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
      categories: [{ categoryId: 0, limit: 0 }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'categories'
  })

  // Watch period to auto-adjust dates if MONTHLY is selected
  const period = watch('period')
  useEffect(() => {
    if (period === 'MONTHLY') {
      setValue('startDate', format(startOfMonth(new Date()), 'yyyy-MM-dd'))
      setValue('endDate', format(endOfMonth(new Date()), 'yyyy-MM-dd'))
    }
  }, [period, setValue])

  if (!isOpen) return null

  const onSubmit = async (data: BudgetFormValues) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await window.api.budgets.create({
        ...data,
        startDate: parseLocalDate(data.startDate),
        endDate: parseLocalDate(data.endDate)
      })

      if (result.success) {
        reset()
        closeModal()
        onSuccess()
      } else {
        setError(result.error ?? 'Error al crear el presupuesto')
      }
    } catch (e) {
      setError('Error inesperado')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filtrar las categorías que ya fueron seleccionadas
  const selectedCategoryIds = watch('categories').map(c => c.categoryId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121418] border border-white/10 rounded-[28px] shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#10B981] mb-1">
              Nuevo
            </p>
            <h2 className="text-xl font-semibold text-white">Presupuesto</h2>
          </div>
          <button
            onClick={closeModal}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-sm">
              {error}
            </div>
          )}

          <form id="budget-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Nombre del Presupuesto
                </label>
                <Input
                  {...register('name')}
                  placeholder="Ej. Gastos de Marzo"
                  className={errors.name ? 'border-rose-500/50' : ''}
                />
                {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Período
                  </label>
                  <Controller
                    name="period"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-12 bg-black/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MONTHLY">Mensual</SelectItem>
                          <SelectItem value="BIWEEKLY">Quincenal</SelectItem>
                          <SelectItem value="WEEKLY">Semanal</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Fecha Inicio
                  </label>
                  <Controller
                    name="startDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        value={field.value ? new Date(field.value + 'T00:00:00') : null}
                        onChange={(d) => field.onChange(d ? format(d, 'yyyy-MM-dd') : '')}
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Fecha Fin
                  </label>
                  <Controller
                    name="endDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        value={field.value ? new Date(field.value + 'T00:00:00') : null}
                        onChange={(d) => field.onChange(d ? format(d, 'yyyy-MM-dd') : '')}
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Límites por Categoría
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => append({ categoryId: 0, limit: 0 })}
                  className="h-8 text-xs text-[#10B981]"
                >
                  <Plus size={14} className="mr-1" /> Añadir Categoría
                </Button>
              </div>

              {errors.categories?.root && (
                <p className="text-xs text-rose-500">{errors.categories.root.message}</p>
              )}

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-3">
                    <div className="flex-1">
                      <Controller
                        name={`categories.${index}.categoryId`}
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value ? String(field.value) : ''}
                            onValueChange={(v) => field.onChange(Number(v))}
                          >
                            <SelectTrigger className="h-12 bg-black/20">
                              <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem
                                  key={cat.id}
                                  value={String(cat.id)}
                                  disabled={selectedCategoryIds.includes(cat.id) && selectedCategoryIds[index] !== cat.id}
                                >
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.categories?.[index]?.categoryId && (
                        <p className="mt-1 text-xs text-rose-500">{errors.categories[index]?.categoryId?.message}</p>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <Input
                          type="number"
                          {...register(`categories.${index}.limit`, { valueAsNumber: true })}
                          placeholder="0"
                          className="pl-8"
                        />
                      </div>
                      {errors.categories?.[index]?.limit && (
                        <p className="mt-1 text-xs text-rose-500">{errors.categories[index]?.limit?.message}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="h-12 w-12 flex items-center justify-center shrink-0 rounded-2xl bg-white/5 hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 shrink-0 bg-[#0A0B0D] flex justify-end gap-3">
          <Button variant="outline" onClick={closeModal} type="button">
            Cancelar
          </Button>
          <Button form="budget-form" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Crear Presupuesto'}
          </Button>
        </div>
      </div>
    </div>
  )
}
