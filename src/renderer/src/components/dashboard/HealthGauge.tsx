import { useCountUp } from '@/hooks/useCountUp'

interface HealthGaugeProps {
  score: number
  loading?: boolean
  onViewRecommendations?: () => void
}

function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Excelente', color: '#10B981' }
  if (score >= 60) return { label: 'Bueno', color: '#60A5FA' }
  if (score >= 40) return { label: 'Regular', color: '#F59E0B' }
  if (score > 0)   return { label: 'Crítico', color: '#F43F5E' }
  return { label: '—', color: '#4B5563' }
}

export function HealthGauge({ score, loading = false, onViewRecommendations }: HealthGaugeProps): JSX.Element {
  const animatedScore = useCountUp({ end: score, duration: 2000, delay: 600, enabled: !loading && score > 0 })
  const { label, color } = getScoreLabel(score)

  // Circunferencia: r=80 → 2π×80 ≈ 502.4
  const circumference = 502.4
  const offset = circumference - (animatedScore / 100) * circumference

  return (
    <div className="bg-[#121418] border border-white/5 rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.2)] p-8 flex flex-col items-center justify-center text-center flex-1">
      <p className="text-[11px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-6">
        Salud Financiera
      </p>

      {/* Gauge SVG */}
      <div className="relative w-40 h-40 flex items-center justify-center group cursor-help">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 176 176">
          {/* Track */}
          <circle
            cx="88" cy="88" r="80"
            fill="transparent"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="12"
          />
          {/* Fill */}
          <circle
            cx="88" cy="88" r="80"
            fill="transparent"
            stroke={loading ? '#1f2937' : color}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={loading ? circumference : offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.15s linear, stroke 0.5s ease',
              filter: loading ? 'none' : `drop-shadow(0 0 12px ${color}66)`
            }}
          />
        </svg>

        {/* Texto central */}
        <div className="absolute flex flex-col items-center pointer-events-none">
          {loading ? (
            <span className="text-4xl font-bold text-gray-700">—</span>
          ) : (
            <>
              <span
                className="text-5xl font-['Plus_Jakarta_Sans',sans-serif] font-bold tabular-nums flex items-baseline"
                style={{ color }}
              >
                {Math.floor(animatedScore)}
                <span className="text-[10px] text-gray-500 font-normal ml-1">/100</span>
              </span>
              <span className="text-[10px] text-gray-500 font-bold uppercase mt-1">
                {label}
              </span>
            </>
          )}
        </div>
        
        {/* Tooltip interactivo flotante */}
        {!loading && (
          <div className="absolute left-1/2 -top-4 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 border border-white/20 px-3 py-2 rounded-xl shadow-2xl pointer-events-none z-10 w-48 text-center">
            <p className="text-[10px] text-gray-400">Salud calculada sobre {Math.floor(animatedScore)}%. Haz clic en 'Ver Salud Financiera' para más detalles.</p>
          </div>
        )}
      </div>

      <button
        onClick={onViewRecommendations}
        className="mt-8 w-full py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-gray-300 hover:bg-white/10 hover:text-white transition-all"
      >
        Ver Salud Financiera
      </button>
    </div>
  )
}
