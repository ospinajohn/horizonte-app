import { useCountUp } from '@/hooks/useCountUp'

interface GaugeChartProps {
  value: number
  max?: number
  variant?: 'semi-circle' | 'full-circle'
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
  sublabel?: string
  animated?: boolean
  zones?: Array<{ upTo: number; color: string }>
}

function getColorForValue(value: number, zones?: Array<{ upTo: number; color: string }>): string {
  if (!zones) return '#10B981'
  for (const zone of zones) {
    if (value <= zone.upTo) return zone.color
  }
  return zones[zones.length - 1].color
}

export function GaugeChart({
  value,
  max = 100,
  variant = 'semi-circle',
  size = 220,
  strokeWidth = 12,
  color,
  label,
  sublabel,
  animated = true,
  zones
}: GaugeChartProps): JSX.Element {
  const animatedValue = useCountUp({ end: value, duration: 2000, delay: 200 })
  const displayValue = animated ? animatedValue : value
  const pct = Math.min(displayValue / max, 1)
  const resolvedColor = color ?? getColorForValue(displayValue, zones)

  if (variant === 'full-circle') {
    const r = (size - strokeWidth * 2) / 2
    const cx = size / 2
    const cy = size / 2
    const circumference = 2 * Math.PI * r
    const dashOffset = circumference - pct * circumference

    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={cx} cy={cy} r={r}
            fill="none" stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={cx} cy={cy} r={r}
            fill="none" stroke={resolvedColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{
              transition: 'stroke-dashoffset 1.5s ease',
              filter: `drop-shadow(0 0 8px ${resolvedColor}80)`
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-['Plus_Jakarta_Sans',sans-serif] font-extrabold"
            style={{ fontSize: size * 0.22, color: resolvedColor }}
          >
            {displayValue.toFixed(1)}
          </span>
          {label && <span className="text-xs text-gray-500 mt-1">{label}</span>}
          {sublabel && <span className="text-[10px] text-gray-600 mt-0.5">{sublabel}</span>}
        </div>
      </div>
    )
  }

  // Semi-circle variant
  const svgWidth = size
  const svgHeight = size * 0.68
  const r = (size * 0.36)
  const cx = svgWidth / 2
  const cy = svgHeight * 0.82
  const circumference = Math.PI * r
  const dashOffset = circumference - pct * circumference

  return (
    <div className="group relative cursor-help">
      <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth} strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke={resolvedColor}
          strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={`${dashOffset}`}
          style={{
            transition: 'stroke-dashoffset 0.1s linear, stroke 0.5s ease',
            filter: `drop-shadow(0 0 8px ${resolvedColor}80)`
          }}
        />
        <text
          x={cx} y={cy - 18}
          textAnchor="middle" fill="white"
          fontSize={size * 0.19} fontWeight="800"
          fontFamily="'Plus Jakarta Sans', sans-serif"
        >
          {Math.round(displayValue)}
        </text>
        <text x={cx + size * 0.12} y={cy - 22} textAnchor="middle" fill="#6B7280" fontSize={size * 0.06}>
          / {max}
        </text>
        {label && (
          <text
            x={cx} y={cy + 4}
            textAnchor="middle" fill={resolvedColor}
            fontSize={size * 0.06} fontWeight="700"
            fontFamily="'Plus Jakarta Sans', sans-serif"
          >
            {label}
          </text>
        )}
      </svg>
    </div>
  )
}
