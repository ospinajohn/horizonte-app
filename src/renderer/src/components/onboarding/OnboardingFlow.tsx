import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const step1Schema = z.object({
  userName: z.string().min(2, 'Introduce tu nombre')
})

const step2Schema = z.object({
  currency: z.enum(['COP', 'USD', 'EUR', 'MXN']),
  payDay: z.coerce.number().min(1).max(31),
  secondPayDay: z.coerce.number().min(1).max(31).optional().or(z.literal(''))
})

const step3Schema = z.object({
  accountName: z.string().min(2, 'El nombre es requerido'),
  accountType: z.enum(['BANCO', 'EFECTIVO', 'NEQUI', 'DAVIPLATA', 'TARJETA', 'AHORROS', 'INVERSION']),
  initialBalance: z.coerce.number().min(0)
})

const step4Schema = z.object({
  amount: z.coerce.number().positive('El monto es requerido'),
  incomeType: z.enum(['Salario', 'Freelance', 'Otro']),
  recurrence: z.enum(['MONTHLY', 'BIWEEKLY'])
})

type Step1 = z.infer<typeof step1Schema>
type Step2 = z.infer<typeof step2Schema>
type Step3 = z.infer<typeof step3Schema>
type Step4 = z.infer<typeof step4Schema>

// ─── Stepper dots ─────────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }): JSX.Element {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'rounded-full transition-all duration-300',
            i < current
              ? 'w-6 h-2 bg-[#10B981]'
              : i === current
              ? 'w-4 h-2 bg-[#10B981]'
              : 'w-2 h-2 bg-white/10'
          )}
        />
      ))}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface OnboardingFlowProps {
  onComplete: () => void
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps): JSX.Element {
  const [step, setStep] = useState(0)
  const [fadeOut, setFadeOut] = useState(false)

  // Data collected
  const [userName, setUserName] = useState('')
  const [currency, setCurrency] = useState('COP')
  const [createdAccountId, setCreatedAccountId] = useState<number | null>(null)
  const [createdAccountName, setCreatedAccountName] = useState<string | null>(null)
  const [createdIncome, setCreatedIncome] = useState<number | null>(null)

  const goToStep = (n: number): void => {
    setFadeOut(true)
    setTimeout(() => {
      setStep(n)
      setFadeOut(false)
    }, 200)
  }

  const next = (): void => goToStep(step + 1)
  const back = (): void => goToStep(step - 1)

  // ── Step 1 ─────────────────────────────────────────────────────────────────
  const step1Form = useForm<Step1>({
    resolver: zodResolver(step1Schema),
    defaultValues: { userName: '' }
  })

  const onStep1 = step1Form.handleSubmit(async (values) => {
    await window.api.config.update({ userName: values.userName })
    setUserName(values.userName)
    next()
  })

  // ── Step 2 ─────────────────────────────────────────────────────────────────
  const step2Form = useForm<Step2>({
    resolver: zodResolver(step2Schema),
    defaultValues: { currency: 'COP', payDay: 15, secondPayDay: '' }
  })

  const onStep2 = step2Form.handleSubmit(async (values) => {
    await window.api.config.update({
      currency: values.currency,
      payDay: values.payDay,
      secondPayDay: values.secondPayDay ? Number(values.secondPayDay) : null
    })
    setCurrency(values.currency)
    next()
  })

  // ── Step 3 ─────────────────────────────────────────────────────────────────
  const step3Form = useForm<Step3>({
    resolver: zodResolver(step3Schema),
    defaultValues: { accountName: '', accountType: 'BANCO', initialBalance: 0 }
  })

  const onStep3 = step3Form.handleSubmit(async (values) => {
    const result = await window.api.accounts.create({
      name: values.accountName,
      type: values.accountType,
      initialBalance: values.initialBalance,
      color: '#10B981',
      icon: values.accountType.toLowerCase(),
      isEmergencyFund: false
    })
    if (result.success && result.data) {
      setCreatedAccountId(result.data.id)
      setCreatedAccountName(values.accountName)
    }
    next()
  })

  const skipStep3 = (): void => {
    setCreatedAccountId(null)
    setCreatedAccountName(null)
    next()
  }

  // ── Step 4 ─────────────────────────────────────────────────────────────────
  const step4Form = useForm<Step4>({
    resolver: zodResolver(step4Schema),
    defaultValues: { amount: 0, incomeType: 'Salario', recurrence: 'MONTHLY' }
  })

  const onStep4 = step4Form.handleSubmit(async (values) => {
    const today = new Date()
    // Crear RecurringItem para el ingreso
    const recurringResult = await window.api.recurring.create({
      name: `${values.incomeType}`,
      type: 'INCOME',
      amount: values.amount,
      recurrence: values.recurrence,
      nextDate: today,
      accountId: createdAccountId ?? undefined
    })

    // Crear transacción inicial si hay cuenta
    if (createdAccountId) {
      await window.api.transactions.create({
        type: 'INCOME',
        amount: values.amount,
        date: today,
        description: values.incomeType,
        accountId: createdAccountId,
        isRecurring: true,
        recurringItemId: recurringResult.success && recurringResult.data ? recurringResult.data.id : undefined
      })
    }

    setCreatedIncome(values.amount)
    next()
  })

  const skipStep4 = (): void => {
    setCreatedIncome(null)
    next()
  }

  // ── Step 5 — Completar ────────────────────────────────────────────────────
  const handleFinish = async (): Promise<void> => {
    await window.api.config.completeOnboarding()
    onComplete()
  }

  // ─── Renderizado de pasos ──────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[100] bg-[#08090B] flex items-center justify-center"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }}
    >
      {/* Glow de fondo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#10B981]/5 rounded-full blur-[120px] pointer-events-none" />

      <div
        className={cn(
          'relative w-full max-w-lg mx-4 bg-[#121418] border border-white/5 rounded-[28px] p-12',
          'transition-all duration-200',
          fadeOut ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
        )}
      >
        <StepDots current={step} total={5} />

        {/* ── Paso 0: Bienvenida ──────────────────────────────────────────── */}
        {step === 0 && (
          <div>
            {/* Logo */}
            <div className="flex justify-center mb-10">
              <div
                className="w-20 h-20 bg-[#10B981] rounded-[28px] flex items-center justify-center"
                style={{ boxShadow: '0 0 60px rgba(16,185,129,0.4), 0 0 120px rgba(16,185,129,0.15)' }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <path d="M3 17l5-5 4 4 9-10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <h1 className="text-3xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-white text-center mb-3">
              Bienvenido a Horizonte
            </h1>
            <p className="text-sm text-gray-400 text-center mb-10 leading-relaxed">
              Tu copiloto financiero personal. Vamos a configurar tu perfil en 2 minutos.
            </p>

            <form onSubmit={onStep1} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                  ¿Cómo te llamas?
                </label>
                <Input
                  {...step1Form.register('userName')}
                  placeholder="Ej. John James"
                  autoFocus
                />
                {step1Form.formState.errors.userName && (
                  <p className="text-xs text-rose-400 mt-1">
                    {step1Form.formState.errors.userName.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-[#10B981] text-black font-bold rounded-2xl hover:bg-[#0ea371] transition-colors text-sm shadow-lg shadow-[#10B981]/20"
              >
                Comenzar →
              </button>
            </form>
          </div>
        )}

        {/* ── Paso 1: Configuración básica ────────────────────────────────── */}
        {step === 1 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#10B981] mb-3">
              Paso 2 de 5
            </p>
            <h2 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white mb-1">
              Configuración básica
            </h2>
            <p className="text-sm text-gray-400 mb-8">Define tu moneda y días de pago.</p>

            <form onSubmit={onStep2} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Moneda
                </label>
                <Controller
                  name="currency"
                  control={step2Form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COP">🇨🇴 Peso Colombiano (COP)</SelectItem>
                        <SelectItem value="USD">🇺🇸 Dólar (USD)</SelectItem>
                        <SelectItem value="EUR">🇪🇺 Euro (EUR)</SelectItem>
                        <SelectItem value="MXN">🇲🇽 Peso Mexicano (MXN)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Día de pago principal
                  </label>
                  <Input
                    {...step2Form.register('payDay')}
                    type="number"
                    min={1}
                    max={31}
                    placeholder="15"
                  />
                  {step2Form.formState.errors.payDay && (
                    <p className="text-xs text-rose-400 mt-1">Día entre 1 y 31</p>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Segundo día (opcional)
                  </label>
                  <Input
                    {...step2Form.register('secondPayDay')}
                    type="number"
                    min={1}
                    max={31}
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={back}
                  className="flex-1 h-11 rounded-2xl border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  ← Atrás
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 bg-[#10B981] text-black font-bold rounded-2xl hover:bg-[#0ea371] transition-colors text-sm"
                >
                  Continuar →
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Paso 2: Primera cuenta ──────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#10B981] mb-3">
              Paso 3 de 5
            </p>
            <h2 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white mb-1">
              Primera cuenta
            </h2>
            <p className="text-sm text-gray-400 mb-8">¿En qué cuenta guardas tu dinero?</p>

            <form onSubmit={onStep3} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Nombre de la cuenta
                </label>
                <Input
                  {...step3Form.register('accountName')}
                  placeholder="Ej. Bancolombia"
                  autoFocus
                />
                {step3Form.formState.errors.accountName && (
                  <p className="text-xs text-rose-400 mt-1">
                    {step3Form.formState.errors.accountName.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Tipo
                  </label>
                  <Controller
                    name="accountType"
                    control={step3Form.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BANCO">Banco</SelectItem>
                          <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                          <SelectItem value="NEQUI">Nequi</SelectItem>
                          <SelectItem value="DAVIPLATA">Daviplata</SelectItem>
                          <SelectItem value="TARJETA">Tarjeta</SelectItem>
                          <SelectItem value="AHORROS">Ahorros</SelectItem>
                          <SelectItem value="INVERSION">Inversión</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Saldo actual
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <Input
                      {...step3Form.register('initialBalance')}
                      type="number"
                      min={0}
                      placeholder="0"
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={back}
                  className="h-11 px-5 rounded-2xl border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  ← Atrás
                </button>
                <button
                  type="button"
                  onClick={skipStep3}
                  className="h-11 px-5 rounded-2xl border border-white/5 text-sm text-gray-600 hover:text-gray-400 transition-all"
                >
                  Omitir
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 bg-[#10B981] text-black font-bold rounded-2xl hover:bg-[#0ea371] transition-colors text-sm"
                >
                  Continuar →
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Paso 3: Ingreso principal ───────────────────────────────────── */}
        {step === 3 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#10B981] mb-3">
              Paso 4 de 5
            </p>
            <h2 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white mb-1">
              Ingreso principal
            </h2>
            <p className="text-sm text-gray-400 mb-8">¿Cuánto ganas al mes?</p>

            <form onSubmit={onStep4} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                  Monto mensual
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <Input
                    {...step4Form.register('amount')}
                    type="number"
                    min={0}
                    placeholder="0"
                    className="pl-8"
                    autoFocus
                  />
                </div>
                {step4Form.formState.errors.amount && (
                  <p className="text-xs text-rose-400 mt-1">
                    {step4Form.formState.errors.amount.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Tipo
                  </label>
                  <Controller
                    name="incomeType"
                    control={step4Form.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Salario">Salario</SelectItem>
                          <SelectItem value="Freelance">Freelance</SelectItem>
                          <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Recurrencia
                  </label>
                  <Controller
                    name="recurrence"
                    control={step4Form.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MONTHLY">Mensual</SelectItem>
                          <SelectItem value="BIWEEKLY">Quincenal</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              {createdAccountId && (
                <p className="text-xs text-gray-500">
                  Se asociará a la cuenta: <span className="text-[#10B981]">{createdAccountName}</span>
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={back}
                  className="h-11 px-5 rounded-2xl border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  ← Atrás
                </button>
                <button
                  type="button"
                  onClick={skipStep4}
                  className="h-11 px-5 rounded-2xl border border-white/5 text-sm text-gray-600 hover:text-gray-400 transition-all"
                >
                  Omitir
                </button>
                <button
                  type="submit"
                  disabled={step4Form.formState.isSubmitting}
                  className="flex-1 h-11 bg-[#10B981] text-black font-bold rounded-2xl hover:bg-[#0ea371] transition-colors text-sm disabled:opacity-50"
                >
                  {step4Form.formState.isSubmitting ? 'Guardando...' : 'Continuar →'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Paso 4: Listo ───────────────────────────────────────────────── */}
        {step === 4 && (
          <div className="text-center">
            {/* Check animation */}
            <div className="flex justify-center mb-8">
              <div className="relative w-24 h-24">
                <div
                  className="w-24 h-24 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center"
                  style={{ animation: 'ping-once 0.6s ease-out' }}
                >
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="text-[#10B981]"
                    style={{ animation: 'draw-check 0.5s ease-out 0.3s both' }}
                  >
                    <path
                      d="M20 6L9 17l-5-5"
                      stroke="#10B981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-white mb-3">
              ¡Todo listo{userName ? `, ${userName}` : ''}!
            </h2>
            <p className="text-sm text-gray-400 mb-8">
              Tu perfil financiero está configurado. Ya puedes empezar a gestionar tus finanzas.
            </p>

            {/* Resumen */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 mb-8 text-left space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-500 uppercase tracking-wider">Usuario</span>
                <span className="text-sm text-white font-medium">{userName || '—'}</span>
              </div>
              <div className="h-px bg-white/5" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-500 uppercase tracking-wider">Moneda</span>
                <span className="text-sm text-white font-medium">{currency}</span>
              </div>
              {createdAccountName && (
                <>
                  <div className="h-px bg-white/5" />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-500 uppercase tracking-wider">Cuenta</span>
                    <span className="text-sm text-[#10B981] font-medium">{createdAccountName}</span>
                  </div>
                </>
              )}
              {createdIncome !== null && (
                <>
                  <div className="h-px bg-white/5" />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-500 uppercase tracking-wider">Ingreso registrado</span>
                    <span className="text-sm text-[#10B981] font-medium">
                      {formatCurrency(createdIncome)}
                    </span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleFinish}
              className="w-full h-12 bg-[#10B981] text-black font-bold rounded-2xl hover:bg-[#0ea371] transition-colors text-sm shadow-lg shadow-[#10B981]/20"
            >
              Ir al Dashboard →
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes ping-once {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
