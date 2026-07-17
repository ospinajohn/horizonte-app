import { useState, useEffect, useCallback } from 'react'
import { formatCurrency, cn } from '@/lib/utils'
import type { EmergencyFundData } from '../../../../shared/types'
import { Shield, Wallet } from 'lucide-react'

// ── Progress Ring ──────────────────────────────────────────────────────────────
function ProgressRing({ monthsCovered, targetMonths }: { monthsCovered: number; targetMonths: number }): JSX.Element {
  const r = 80
  const cx = 100
  const cy = 100
  const circumference = 2 * Math.PI * r
  const pct = Math.min(monthsCovered / targetMonths, 1)
  const strokeDashoffset = circumference - pct * circumference

  let strokeColor = '#F43F5E'
  let centerTextColor = 'text-rose-400'
  if (monthsCovered >= targetMonths) { strokeColor = '#10B981'; centerTextColor = 'text-[#10B981]' }
  else if (monthsCovered >= targetMonths * 0.5) { strokeColor = '#F59E0B'; centerTextColor = 'text-amber-400' }

  return (
    <div className="relative flex items-center justify-center">
      <svg width="220" height="220" viewBox="0 0 200 200">
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
        {/* Target marker at 100% */}
        <circle cx={cx} cy={cy - r} r="5" fill={strokeColor} opacity="0.6" />
        {/* Progress */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 100 100)"
          style={{
            transition: 'stroke-dashoffset 1.5s ease',
            filter: `drop-shadow(0 0 8px ${strokeColor})`
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-5xl font-["Plus_Jakarta_Sans",sans-serif] font-extrabold', centerTextColor)}>
          {monthsCovered.toFixed(1)}
        </span>
        <span className="text-xs text-gray-500 mt-1">meses cubiertos</span>
        <span className="text-[10px] text-gray-600 mt-0.5">meta: {targetMonths} meses</span>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export function EmergencyFundPage(): JSX.Element {
  const [data, setData] = useState<EmergencyFundData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (): Promise<void> => {
    setLoading(true)
    const result = await window.api.emergencyFund.getData()
    if (result.success && result.data) setData(result.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin" />
      </div>
    )
  }

  const d = data ?? {
    monthlyExpenseAvg: 0,
    emergencyFundBalance: 0,
    monthsCovered: 0,
    targetMonths: 6,
    targetAmount: 0,
    missingAmount: 0,
    monthlyContributionNeeded: 0,
    emergencyAccounts: []
  }

  const isOnTrack = d.monthsCovered >= d.targetMonths

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-12 py-8 shrink-0 border-b border-white/5 bg-[#08090B]/80 backdrop-blur-md sticky top-0 z-10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#10B981] mb-2">// Módulo</p>
        <h1 className="text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-white tracking-tight">
          Fondo de Emergencia
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-12 py-8 custom-scrollbar">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Ring hero */}
          <div className="bg-[#121418] border border-white/5 rounded-[28px] p-10 flex items-center justify-center relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#10B981]/5 rounded-full blur-[80px] pointer-events-none" />
            <ProgressRing monthsCovered={d.monthsCovered} targetMonths={d.targetMonths} />
          </div>

          {/* Stats */}
          <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8 space-y-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Gasto mensual promedio</p>
              <p className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white">{formatCurrency(d.monthlyExpenseAvg)}</p>
            </div>

            <div className="h-px bg-white/5" />

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Saldo del fondo</p>
              <p className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[#10B981]">{formatCurrency(d.emergencyFundBalance)}</p>
            </div>

            <div className="h-px bg-white/5" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Meta ({d.targetMonths} meses)</p>
                <p className="text-base font-bold text-amber-400">{formatCurrency(d.targetAmount)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Falta para la meta</p>
                <p className={cn('text-base font-bold', d.missingAmount === 0 ? 'text-[#10B981]' : 'text-rose-400')}>
                  {d.missingAmount === 0 ? '¡Meta alcanzada!' : formatCurrency(d.missingAmount)}
                </p>
              </div>
            </div>

            {d.monthlyContributionNeeded > 0 && (
              <>
                <div className="h-px bg-white/5" />
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-1">Ahorro mensual recomendado</p>
                  <p className="text-xl font-bold text-amber-400">{formatCurrency(d.monthlyContributionNeeded)}</p>
                  <p className="text-xs text-gray-500 mt-1">Para completar el fondo en 12 meses</p>
                </div>
              </>
            )}

            {isOnTrack && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
                <Shield size={20} className="text-[#10B981]" />
                <div>
                  <p className="text-sm font-bold text-[#10B981]">Fondo completo</p>
                  <p className="text-xs text-gray-400">Tu fondo de emergencia está en el nivel recomendado</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Emergency accounts */}
        <div className="bg-[#121418] border border-white/5 rounded-[28px] p-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">Cuentas del fondo</p>
          {d.emergencyAccounts.length === 0 ? (
            <div className="text-center py-8">
              <Wallet size={28} className="text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-2">Sin cuentas designadas como fondo de emergencia</p>
              <p className="text-xs text-gray-600">
                Ve a Cuentas y marca las cuentas que conforman tu fondo de emergencia con la opción "Fondo de emergencia".
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {d.emergencyAccounts.map((account: any) => (
                <div key={account.id} className="flex justify-between items-center py-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${account.color}20` }}>
                      <Wallet size={14} style={{ color: account.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{account.name}</p>
                      <p className="text-[10px] text-gray-500">{account.type}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-[#10B981]">{formatCurrency(account.currentBalance ?? 0)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
