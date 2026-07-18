import { useEffect, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Paperclip, Tag } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useAccounts } from '@/hooks/useAccounts'
import { useCategories } from '@/hooks/useCategories'
import type { Transaction, PaymentMethod, RecurrenceType, CreateTransactionDto, CreateRecurringItemDto } from '../../../../shared/types'

type Mode = 'income' | 'expense'

interface TransactionFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  mode: Mode
  transaction?: Transaction | null
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  DEBIT: 'Débito',
  CREDIT: 'Crédito',
  TRANSFER: 'Transferencia'
}

const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  NONE: 'Única vez',
  DAILY: 'Diaria',
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quincenal',
  MONTHLY: 'Mensual',
  ANNUAL: 'Anual'
}

const schema = z.object({
  amount: z.coerce.number().min(0.01, 'El monto debe ser mayor a 0'),
  date: z.string().min(1, 'La fecha es requerida'),
  categoryId: z.coerce.number().optional(),
  accountId: z.coerce.number().min(1, 'Selecciona una cuenta'),
  description: z.string().optional(),
  notes: z.string().optional(),
  // expense-only
  paymentMethod: z.enum(['CASH', 'DEBIT', 'CREDIT', 'TRANSFER']).optional(),
  receiptPath: z.string().optional(),
  // income-only
  recurrence: z.enum(['NONE', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ANNUAL']).optional()
})

type FormValues = z.infer<typeof schema>

export function TransactionFormModal({ open, onClose, onSuccess, mode, transaction }: TransactionFormModalProps): JSX.Element {
  const isEdit = !!transaction
  const isExpense = mode === 'expense'
  const isIncome = mode === 'income'

  const { accounts } = useAccounts()
  const { categories } = useCategories(isExpense ? 'EXPENSE' : 'INCOME')

  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: 0,
      date: format(new Date(), 'yyyy-MM-dd'),
      categoryId: undefined,
      accountId: undefined,
      description: '',
      notes: '',
      paymentMethod: 'CASH',
      receiptPath: '',
      recurrence: 'NONE'
    }
  })

  useEffect(() => {
    if (open) {
      if (transaction) {
        const d = transaction.date instanceof Date ? transaction.date : new Date(transaction.date)
        reset({
          amount: transaction.amount,
          date: format(d, 'yyyy-MM-dd'),
          categoryId: transaction.categoryId ?? undefined,
          accountId: transaction.accountId,
          description: transaction.description ?? '',
          notes: transaction.notes ?? '',
          paymentMethod: transaction.paymentMethod ?? 'CASH',
          receiptPath: transaction.receiptPath ?? '',
          recurrence: 'NONE'
        })
        setTags(transaction.tags ?? [])
        setReceiptPreview(transaction.receiptPath ?? null)
      } else {
        reset({
          amount: 0,
          date: format(new Date(), 'yyyy-MM-dd'),
          categoryId: undefined,
          accountId: accounts[0]?.id,
          description: '',
          notes: '',
          paymentMethod: 'CASH',
          receiptPath: '',
          recurrence: 'NONE'
        })
        setTags([])
        setReceiptPreview(null)
      }
    }
  }, [open, transaction, accounts, reset])

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const newTag = tagInput.trim()
      if (!tags.includes(newTag)) setTags(prev => [...prev, newTag])
      setTagInput('')
    }
  }

  const removeTag = (tag: string): void => setTags(prev => prev.filter(t => t !== tag))

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (file) {
      setValue('receiptPath', file.path ?? (file as any).path ?? file.name)
      const reader = new FileReader()
      reader.onload = (ev) => setReceiptPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = async (values: FormValues): Promise<void> => {
    const dto: CreateTransactionDto = {
      type: isExpense ? 'EXPENSE' : 'INCOME',
      amount: values.amount,
      date: new Date(values.date),
      description: values.description || undefined,
      notes: values.notes || undefined,
      accountId: values.accountId,
      categoryId: values.categoryId || undefined,
      ...(isExpense && {
        paymentMethod: values.paymentMethod,
        tags: tags.length > 0 ? tags : undefined,
        receiptPath: values.receiptPath || undefined
      }),
      isRecurring: isIncome && values.recurrence !== 'NONE'
    }

    let result
    if (isEdit && transaction) {
      result = await window.api.transactions.update(transaction.id, dto)
    } else {
      result = await window.api.transactions.create(dto)
    }

    if (result.success && result.data) {
      // If income with recurrence, also create recurring item
      if (isIncome && values.recurrence !== 'NONE' && !isEdit) {
        const recurringDto: CreateRecurringItemDto = {
          name: values.description || 'Ingreso recurrente',
          type: 'INCOME',
          amount: values.amount,
          recurrence: values.recurrence!,
          nextDate: new Date(values.date),
          categoryId: values.categoryId || undefined,
          accountId: values.accountId
        }
        await window.api.recurring.create(recurringDto)
      }
      onSuccess()
      onClose()
    }
  }

  const titleLabel = isExpense ? 'Gasto' : 'Ingreso'

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[90vh] bg-[#121418] border border-white/5 rounded-[28px] shadow-xl focus:outline-none overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-8 pb-0 shrink-0">
            <div>
              <p className={cn(
                "text-[10px] font-bold uppercase tracking-widest mb-1",
                isExpense ? 'text-rose-400' : 'text-[#10B981]'
              )}>
                {isEdit ? 'Editar' : 'Nuevo'} {titleLabel}
              </p>
              <Dialog.Title className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white">
                {isEdit ? `Editar ${titleLabel.toLowerCase()}` : `Registrar ${titleLabel.toLowerCase()}`}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition-all"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-5">
            {/* Amount */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                Monto
              </label>
              <Input {...register('amount')} type="number" min={0} step="0.01" placeholder="0" />
              {errors.amount && <p className="text-xs text-rose-400 mt-1">{errors.amount.message}</p>}
            </div>

            {/* Date */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                Fecha
              </label>
              <Input {...register('date')} type="date" />
            </div>

            {/* Category */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                Categoría
              </label>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value != null ? String(field.value) : ''}
                    onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Account */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                Cuenta
              </label>
              <Controller
                name="accountId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value != null ? String(field.value) : ''}
                    onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una cuenta" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(a => (
                        <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.accountId && <p className="text-xs text-rose-400 mt-1">{errors.accountId.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                Descripción <span className="text-gray-700 normal-case tracking-normal">(opcional)</span>
              </label>
              <Input {...register('description')} placeholder="Ej. Mercado semanal" />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                Notas <span className="text-gray-700 normal-case tracking-normal">(opcional)</span>
              </label>
              <textarea
                {...register('notes')}
                rows={2}
                placeholder="Notas adicionales..."
                className="w-full rounded-2xl border border-white/5 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#10B981]/50 resize-none"
              />
            </div>

            {/* EXPENSE-ONLY FIELDS */}
            {isExpense && (
              <>
                {/* Payment Method */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Método de pago
                  </label>
                  <Controller
                    name="paymentMethod"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(m => (
                            <SelectItem key={m} value={m}>{PAYMENT_METHOD_LABELS[m]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Etiquetas
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300"
                      >
                        <Tag size={10} />
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-gray-600 hover:text-white ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <Input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Escribe y presiona Enter para agregar"
                  />
                </div>

                {/* Receipt */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Comprobante
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {receiptPreview ? (
                    <div className="relative">
                      <img
                        src={receiptPreview}
                        alt="Comprobante"
                        className="w-full h-32 object-cover rounded-2xl border border-white/10"
                      />
                      <button
                        type="button"
                        onClick={() => { setReceiptPreview(null); setValue('receiptPath', '') }}
                        className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-black/60 flex items-center justify-center text-white hover:bg-black/80"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-20 rounded-2xl border border-dashed border-white/10 flex items-center justify-center gap-2 text-gray-600 hover:text-gray-400 hover:border-white/20 transition-all text-sm"
                    >
                      <Paperclip size={16} />
                      Adjuntar comprobante
                    </button>
                  )}
                </div>
              </>
            )}

            {/* INCOME-ONLY FIELDS */}
            {isIncome && !isEdit && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Recurrencia
                </label>
                <Controller
                  name="recurrence"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(RECURRENCE_LABELS) as RecurrenceType[]).map(r => (
                          <SelectItem key={r} value={r}>{RECURRENCE_LABELS[r]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {watch('recurrence') !== 'NONE' && (
                  <p className="text-[11px] text-blue-400 mt-1.5">
                    Se creará un item recurrente automáticamente.
                  </p>
                )}
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-10 rounded-2xl border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'flex-1 h-10 rounded-2xl font-bold text-sm transition-all disabled:opacity-50',
                  isExpense
                    ? 'bg-rose-500 text-white hover:bg-rose-600'
                    : 'bg-[#10B981] text-black hover:bg-[#0ea371]'
                )}
              >
                {isSubmitting ? 'Guardando...' : isEdit ? `Actualizar ${titleLabel.toLowerCase()}` : `Registrar ${titleLabel.toLowerCase()}`}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
