import { useState, useEffect } from 'react'
import { RefreshCw, Download, RotateCcw } from 'lucide-react'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import type { AppConfig } from '../../../../shared/types'

type ConfigDraft = {
  userName: string
  currency: string
  payDay: number
  secondPayDay: number | null
  notificationsEnabled: boolean
  alertDaysAhead: number
}

const CURRENCIES = [
  { value: 'COP', label: 'COP — Peso Colombiano' },
  { value: 'USD', label: 'USD — Dólar Estadounidense' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'MXN', label: 'MXN — Peso Mexicano' }
]

const ALERT_DAYS = [
  { value: 1, label: '1 día antes' },
  { value: 3, label: '3 días antes' },
  { value: 7, label: '7 días antes' }
]

function SectionHeader({ title }: { title: string }): JSX.Element {
  return (
    <div className="pb-4 border-b border-white/5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{title}</p>
    </div>
  )
}

function SaveButton({
  onClick,
  saving,
  saved
}: {
  onClick: () => void
  saving: boolean
  saved: boolean
}): JSX.Element {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${
        saved
          ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
          : 'bg-[#10B981] text-black hover:bg-[#3EB489]'
      } disabled:opacity-50`}
    >
      {saving ? '...' : saved ? '✓ Guardado' : 'Guardar'}
    </button>
  )
}

export function SettingsPage(): JSX.Element {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [draft, setDraft] = useState<ConfigDraft>({
    userName: 'Usuario',
    currency: 'COP',
    payDay: 15,
    secondPayDay: null,
    notificationsEnabled: true,
    alertDaysAhead: 3
  })

  const [savingProfile, setSavingProfile] = useState(false)
  const [savedProfile, setSavedProfile] = useState(false)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [savedPrefs, setSavedPrefs] = useState(false)
  const [generatingRecs, setGeneratingRecs] = useState(false)

  useEffect(() => {
    window.api.config.get().then((res: any) => {
      if (res.success && res.data) {
        setConfig(res.data)
        setDraft((d) => ({
          ...d,
          userName: res.data.userName ?? 'Usuario',
          currency: res.data.currency ?? 'COP',
          payDay: res.data.payDay ?? 15,
          secondPayDay: res.data.secondPayDay ?? null
        }))
      }
    })
  }, [])

  const saveProfile = async (): Promise<void> => {
    setSavingProfile(true)
    await window.api.config.update({ userName: draft.userName })
    setSavingProfile(false)
    setSavedProfile(true)
    setTimeout(() => setSavedProfile(false), 2000)
  }

  const savePreferences = async (): Promise<void> => {
    setSavingPrefs(true)
    await window.api.config.update({
      currency: draft.currency,
      payDay: draft.payDay,
      secondPayDay: draft.secondPayDay
    })
    setSavingPrefs(false)
    setSavedPrefs(true)
    setTimeout(() => setSavedPrefs(false), 2000)
  }

  const handleGenerateRecs = async (): Promise<void> => {
    setGeneratingRecs(true)
    await window.api.recommendations.generate()
    setGeneratingRecs(false)
  }

  const handleExportCSV = async (): Promise<void> => {
    try {
      const res = await window.api.transactions.getAll({})
      if (!res.success || !res.data) return
      const txs = res.data
      const header = 'Fecha,Tipo,Monto,Descripción,Categoría,Cuenta'
      const rows = txs.map((t: any) => [
        new Date(t.date).toLocaleDateString('es-CO'),
        t.type,
        t.amount,
        (t.description ?? '').replace(/,/g, ';'),
        t.category?.name ?? '',
        t.account?.name ?? ''
      ].join(','))
      const csv = [header, ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `horizonte-transacciones-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // ignore
    }
  }

  const handleResetOnboarding = async (): Promise<void> => {
    if (!confirm('¿Reiniciar el onboarding? Se recargará la aplicación.')) return
    await window.api.config.update({ onboardingCompleted: false })
    window.location.reload()
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-[700px] mx-auto p-12 space-y-10">
        {/* Header */}
        <div>
          <p className="text-[10px] font-bold text-[#10B981] uppercase tracking-[0.4em]">
            CONFIGURACIÓN
          </p>
          <h1 className="text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold tracking-tight text-white mt-1">
            Ajustes
          </h1>
        </div>

        {/* Sección: Perfil */}
        <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8 space-y-6">
          <SectionHeader title="Perfil" />
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Tu nombre
              </span>
              <input
                value={draft.userName}
                onChange={(e) => setDraft((d) => ({ ...d, userName: e.target.value }))}
                className="w-full bg-[#0F1115] border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-[#10B981]/50 transition-all"
                placeholder="Tu nombre"
              />
            </label>
            <div className="flex justify-end">
              <SaveButton onClick={saveProfile} saving={savingProfile} saved={savedProfile} />
            </div>
          </div>
        </div>

        {/* Sección: Preferencias financieras */}
        <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8 space-y-6">
          <SectionHeader title="Preferencias Financieras" />
          <div className="space-y-5">
            <label className="block space-y-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Moneda</span>
              <Select
                value={draft.currency}
                onValueChange={(v) => setDraft((d) => ({ ...d, currency: v }))}
              >
                <SelectTrigger className="w-full bg-[#0F1115] px-5 py-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block space-y-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Día de pago
                </span>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={draft.payDay}
                  onChange={(e) => setDraft((d) => ({ ...d, payDay: Number(e.target.value) }))}
                  className="w-full bg-[#0F1115] border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  2° día de pago (opcional)
                </span>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={draft.secondPayDay ?? ''}
                  onChange={(e) => setDraft((d) => ({
                    ...d,
                    secondPayDay: e.target.value ? Number(e.target.value) : null
                  }))}
                  placeholder="—"
                  className="w-full bg-[#0F1115] border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none placeholder:text-gray-600"
                />
              </label>
            </div>

            <div className="flex justify-end">
              <SaveButton onClick={savePreferences} saving={savingPrefs} saved={savedPrefs} />
            </div>
          </div>
        </div>

        {/* Sección: Apariencia */}
        <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8 space-y-4">
          <SectionHeader title="Apariencia" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white font-bold">Tema oscuro</p>
              <p className="text-xs text-gray-600 mt-0.5">Dark Mode activo — es el único tema disponible en v1.0</p>
            </div>
            <div
              className="px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: '#10B98115', color: '#10B981', border: '1px solid #10B98140' }}
            >
              ACTIVO
            </div>
          </div>
        </div>

        {/* Sección: Notificaciones */}
        <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8 space-y-5">
          <SectionHeader title="Notificaciones" />
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-bold">Notificaciones nativas</p>
                <p className="text-xs text-gray-600 mt-0.5">Alertas del sistema para pagos y presupuestos</p>
              </div>
              <button
                onClick={() => setDraft((d) => ({ ...d, notificationsEnabled: !d.notificationsEnabled }))}
                className={`relative w-12 h-6 rounded-full transition-all ${
                  draft.notificationsEnabled ? 'bg-[#10B981]' : 'bg-white/10'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    draft.notificationsEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <label className="block space-y-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Anticipación de alertas
              </span>
              <Select
                value={String(draft.alertDaysAhead)}
                onValueChange={(v) => setDraft((d) => ({ ...d, alertDaysAhead: Number(v) }))}
              >
                <SelectTrigger className="w-full bg-[#0F1115] px-5 py-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALERT_DAYS.map((a) => (
                    <SelectItem key={a.value} value={String(a.value)}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <p className="text-[10px] text-gray-600">
              Nota: Las preferencias de notificaciones se guardan localmente en esta sesión.
            </p>
          </div>
        </div>

        {/* Sección: Datos */}
        <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8 space-y-5">
          <SectionHeader title="Datos y Acciones" />
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm text-white font-bold">Regenerar recomendaciones</p>
                <p className="text-xs text-gray-600 mt-0.5">Analiza tu estado financiero actual</p>
              </div>
              <button
                onClick={handleGenerateRecs}
                disabled={generatingRecs}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-2xl text-xs font-bold text-gray-400 hover:text-white transition-all"
              >
                <RefreshCw size={14} className={generatingRecs ? 'animate-spin' : ''} />
                Regenerar
              </button>
            </div>

            <div className="border-t border-white/5" />

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm text-white font-bold">Exportar datos (CSV)</p>
                <p className="text-xs text-gray-600 mt-0.5">Descarga todas tus transacciones</p>
              </div>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-2xl text-xs font-bold text-gray-400 hover:text-white transition-all"
              >
                <Download size={14} />
                Exportar
              </button>
            </div>

            <div className="border-t border-white/5" />

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm text-white font-bold">Reiniciar onboarding</p>
                <p className="text-xs text-gray-600 mt-0.5">Volver al asistente de configuración inicial</p>
              </div>
              <button
                onClick={handleResetOnboarding}
                className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-4 py-2.5 rounded-2xl text-xs font-bold text-rose-400 transition-all"
              >
                <RotateCcw size={14} />
                Reiniciar
              </button>
            </div>
          </div>
        </div>

        {/* Sección: Información */}
        <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8 space-y-4">
          <SectionHeader title="Información" />
          <div className="space-y-3 font-['JetBrains_Mono',monospace] text-xs text-gray-500">
            <div className="flex justify-between">
              <span>Versión</span>
              <span className="text-gray-400">Horizonte v1.0</span>
            </div>
            <div className="flex justify-between">
              <span>Shell</span>
              <span className="text-gray-400">Electron 33</span>
            </div>
            <div className="flex justify-between">
              <span>UI</span>
              <span className="text-gray-400">React 18 + TypeScript</span>
            </div>
            <div className="flex justify-between">
              <span>Base de datos</span>
              <span className="text-gray-400">Prisma + SQLite</span>
            </div>
            <div className="flex justify-between">
              <span>Cuenta activa</span>
              <span className="text-[#10B981]">{config?.userName ?? 'Usuario'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
