import { useState, useEffect, useRef } from 'react'
import { formatCurrency } from '@/lib/utils'

interface DataPoint {
  label: string
  value: number
}

interface TelemetryChartProps {
  data?: DataPoint[]
  historicalData?: DataPoint[]
  projectedValue?: number
}

function buildPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return ''
  let d = `M${points[0].x},${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const cp1x = points[i].x + (points[i + 1].x - points[i].x) * 0.4
    const cp1y = points[i].y
    const cp2x = points[i + 1].x - (points[i + 1].x - points[i].x) * 0.4
    const cp2y = points[i + 1].y
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${points[i + 1].x},${points[i + 1].y}`
  }
  return d
}

export function TelemetryChart({
  data = [],
  historicalData = [],
  projectedValue = 0
}: TelemetryChartProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<'proyeccion' | 'historico'>('proyeccion')
  const [drawProgress, setDrawProgress] = useState(0)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const pathRef = useRef<SVGPathElement | null>(null)
  const [pathLength, setPathLength] = useState(0)

  // Datos activos según tab
  const activeData = activeTab === 'proyeccion' ? data : historicalData
  const hasData = activeData.length >= 2

  // Normalizar puntos al viewbox
  const W = 1000
  const H = 300
  const PAD = 20
  const maxVal = hasData ? Math.max(...activeData.map((d) => Math.abs(d.value)), 1) : 1
  const minVal = hasData ? Math.min(...activeData.map((d) => d.value), 0) : 0
  const range = maxVal - minVal || 1

  const points = activeData.map((d, i) => ({
    x: PAD + (i / Math.max(activeData.length - 1, 1)) * (W - PAD * 2),
    y: H - PAD - (((d.value - minVal) / range) * (H - PAD * 2))
  }))

  const linePath = hasData ? buildPath(points) : ''
  const areaPath = hasData
    ? `${linePath} L${points[points.length - 1].x},${H} L${points[0].x},${H} Z`
    : ''

  // Medir longitud del path cuando cambia
  useEffect(() => {
    if (pathRef.current && linePath) {
      setPathLength(pathRef.current.getTotalLength())
    }
  }, [linePath])

  // Animación de dibujo al cambiar tab o datos
  useEffect(() => {
    setDrawProgress(0)
    startTimeRef.current = null
    const duration = 2400

    const animate = (ts: number): void => {
      if (!startTimeRef.current) startTimeRef.current = ts
      const elapsed = ts - startTimeRef.current
      const p = Math.min(elapsed / duration, 1)
      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2
      setDrawProgress(eased)
      if (p < 1) animFrameRef.current = requestAnimationFrame(animate)
    }

    const tid = setTimeout(() => {
      animFrameRef.current = requestAnimationFrame(animate)
    }, 300)

    return () => {
      clearTimeout(tid)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [activeTab, activeData.length])

  const strokeOffset = pathLength > 0 ? pathLength * (1 - drawProgress) : pathLength

  return (
    <div className="col-span-12 lg:col-span-9 bg-[#121418] border border-white/5 rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.2)] p-10 flex flex-col">

      {/* Header */}
      <div className="flex justify-between items-center mb-12">
        <div>
          <h3 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold">
            Financial Vector Telemetry
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {activeTab === 'proyeccion'
              ? 'Proyección acumulada del saldo a 6 meses basada en ingresos y gastos recurrentes.'
              : 'Evolución real del balance financiero en los últimos 6 meses.'}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex bg-[#0A0B0D] p-1.5 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('proyeccion')}
            className={
              activeTab === 'proyeccion'
                ? 'px-6 py-2 rounded-xl bg-[#10B981] text-black text-xs font-bold shadow-lg shadow-[#10B981]/20 transition-all'
                : 'px-6 py-2 text-xs font-bold text-gray-500 hover:text-white transition-all'
            }
          >
            Proyección
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={
              activeTab === 'historico'
                ? 'px-6 py-2 rounded-xl bg-[#10B981] text-black text-xs font-bold shadow-lg shadow-[#10B981]/20 transition-all'
                : 'px-6 py-2 text-xs font-bold text-gray-500 hover:text-white transition-all'
            }
          >
            Histórico
          </button>
        </div>
      </div>

      {/* Chart container */}
      <div className="flex-1 min-h-[260px] relative bg-black/20 rounded-[32px] border border-white/5 overflow-hidden px-6 pt-10 pb-2">

        {!hasData ? (
          /* Estado vacío */
          <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center">
            <p className="text-sm text-gray-500 mb-1">Sin datos suficientes</p>
            <p className="text-xs text-gray-600">
              {activeTab === 'proyeccion'
                ? 'Registra ingresos o gastos recurrentes para ver la proyección'
                : 'Registra transacciones en los últimos meses para ver el histórico'}
            </p>
          </div>
        ) : (
          <>
            <svg
              className="w-full"
              style={{ height: '220px' }}
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="telemetry-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Área de relleno */}
              <path
                d={areaPath}
                fill="url(#telemetry-gradient)"
                opacity={drawProgress * 0.8}
              />

              {/* Línea principal con animación de dibujo */}
              <path
                ref={pathRef}
                d={linePath}
                fill="none"
                stroke="#10B981"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray={pathLength > 0 ? pathLength : undefined}
                strokeDashoffset={pathLength > 0 ? strokeOffset : undefined}
                style={{ filter: 'drop-shadow(0 0 10px rgba(16,185,129,0.55))' }}
              />

              {/* Puntos en cada data point */}
              {points.map((p, i) => (
                <g 
                  key={i} 
                  onMouseEnter={() => setHoverIndex(i)} 
                  onMouseLeave={() => setHoverIndex(null)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoverIndex === i ? 8 : (i === points.length - 1 ? 6 : 4.5)}
                    fill={i === points.length - 1 ? 'white' : '#10B981'}
                    opacity={drawProgress > (i / Math.max(points.length - 1, 1)) * 0.7 + 0.3 ? 1 : 0}
                    style={{
                      transition: 'all 0.3s',
                      filter:
                        hoverIndex === i 
                          ? 'drop-shadow(0 0 12px rgba(16,185,129,1))'
                          : (i === points.length - 1
                            ? 'drop-shadow(0 0 8px rgba(255,255,255,0.8))'
                            : 'drop-shadow(0 0 6px rgba(16,185,129,0.6))')
                    }}
                  />
                  {/* Hitbox invisible más grande para facilitar el hover */}
                  <circle cx={p.x} cy={p.y} r={20} fill="transparent" />
                </g>
              ))}
            </svg>

            {/* Eje X — etiquetas */}
            <div className="flex justify-between px-4 mt-1 text-[10px] text-gray-600 font-['JetBrains_Mono',monospace] font-bold uppercase tracking-widest">
              {activeData.map((d, i) => (
                <span key={i} className={hoverIndex === i ? 'text-[#10B981] transition-colors' : 'transition-colors'}>
                  {d.label}
                </span>
              ))}
            </div>
          </>
        )}

        {/* Tooltip interactivo (Hover) */}
        {hoverIndex !== null && activeData[hoverIndex] && (
          <div 
            className="absolute bg-black/90 border border-white/20 p-3 rounded-xl shadow-2xl pointer-events-none z-10 transition-all duration-200"
            style={{ 
              left: `${Math.min(Math.max(points[hoverIndex].x - 60, 20), W - 140)}px`, 
              top: `${Math.max(points[hoverIndex].y - 80, 20)}px` 
            }}
          >
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">
              {activeData[hoverIndex].label}
            </p>
            <p className="text-sm font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white">
              {formatCurrency(activeData[hoverIndex].value)}
            </p>
          </div>
        )}

        {/* Tooltip flotante estático — solo en proyección con datos y si no se está haciendo hover */}
        {activeTab === 'proyeccion' && projectedValue > 0 && hoverIndex === null && (
          <div className="absolute top-4 right-6 bg-black/80 border border-white/10 p-4 rounded-2xl backdrop-blur-md pointer-events-none">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
              Saldo Proyectado
            </p>
            <p className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[#10B981]">
              {formatCurrency(projectedValue)}
            </p>
            <p className="text-[9px] text-gray-600 mt-1 italic">
              Basado en ingresos y gastos recurrentes.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
