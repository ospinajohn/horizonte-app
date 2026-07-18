import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'

interface MonthData {
  label: string
  income: number
  expense: number
}

interface IncomeVsExpenseChartProps {
  data: MonthData[]
}

export function IncomeVsExpenseChart({ data }: IncomeVsExpenseChartProps): JSX.Element {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const hasData = data.length > 0 && data.some((d) => d.income > 0 || d.expense > 0)
  const maxVal = hasData ? Math.max(...data.map((d) => Math.max(d.income, d.expense)), 1) : 1

  const W = 900
  const H = 260
  const PAD = { top: 20, right: 20, bottom: 30, left: 10 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom
  const barGroupWidth = chartW / Math.max(data.length, 1)
  const barWidth = Math.min(barGroupWidth * 0.38, 48)
  const barGap = 4

  return (
    <div className="col-span-12 lg:col-span-9 bg-[#121418] border border-white/5 rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.2)] p-8 flex flex-col">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold">
            Ingresos vs Gastos
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Comparativa mensual de los últimos 6 meses
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#10B981]" />
            <span className="text-xs text-gray-500 font-bold">Ingresos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500" />
            <span className="text-xs text-gray-500 font-bold">Gastos</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[220px] relative bg-black/20 rounded-[32px] border border-white/5 overflow-hidden px-6 pt-6 pb-2">
        {!hasData ? (
          <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center">
            <p className="text-sm text-gray-500 mb-1">Sin datos suficientes</p>
            <p className="text-xs text-gray-600">
              Registra transacciones en los últimos meses para ver la comparativa
            </p>
          </div>
        ) : (
          <>
            <svg className="w-full" style={{ height: '220px' }} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
              {/* Grid lines */}
              {[0.25, 0.5, 0.75, 1].map((pct) => (
                <line
                  key={pct}
                  x1={PAD.left}
                  y1={PAD.top + chartH * (1 - pct)}
                  x2={W - PAD.right}
                  y2={PAD.top + chartH * (1 - pct)}
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth="1"
                />
              ))}

              {/* Bars */}
              {data.map((d, i) => {
                const groupX = PAD.left + i * barGroupWidth + barGroupWidth / 2
                const incomeH = (d.income / maxVal) * chartH
                const expenseH = (d.expense / maxVal) * chartH
                const isHovered = hoverIndex === i

                return (
                  <g
                    key={i}
                    onMouseEnter={() => setHoverIndex(i)}
                    onMouseLeave={() => setHoverIndex(null)}
                    className="cursor-pointer"
                  >
                    {/* Income bar */}
                    <rect
                      x={groupX - barWidth - barGap / 2}
                      y={PAD.top + chartH - incomeH}
                      width={barWidth}
                      rx={6}
                      height={incomeH}
                      fill={isHovered ? '#10B981' : '#10B981'}
                      opacity={isHovered ? 1 : 0.8}
                      style={{
                        transition: 'all 0.3s',
                        filter: isHovered ? 'drop-shadow(0 0 8px rgba(16,185,129,0.6))' : 'none'
                      }}
                    />

                    {/* Expense bar */}
                    <rect
                      x={groupX + barGap / 2}
                      y={PAD.top + chartH - expenseH}
                      width={barWidth}
                      rx={6}
                      height={expenseH}
                      fill={isHovered ? '#F43F5E' : '#F43F5E'}
                      opacity={isHovered ? 1 : 0.8}
                      style={{
                        transition: 'all 0.3s',
                        filter: isHovered ? 'drop-shadow(0 0 8px rgba(244,63,94,0.6))' : 'none'
                      }}
                    />

                    {/* Income value label */}
                    {d.income > 0 && (
                      <text
                        x={groupX - barWidth / 2 - barGap / 2}
                        y={PAD.top + chartH - incomeH - 8}
                        textAnchor="middle"
                        className="font-['JetBrains_Mono',monospace] font-bold"
                        fontSize="9"
                        fill={isHovered ? '#10B981' : '#6B7280'}
                        style={{ transition: 'fill 0.3s' }}
                      >
                        {d.income >= 1000000
                          ? `$${(d.income / 1000000).toFixed(1)}M`
                          : d.income >= 1000
                            ? `$${Math.round(d.income / 1000)}K`
                            : `$${d.income}`}
                      </text>
                    )}

                    {/* Expense value label */}
                    {d.expense > 0 && (
                      <text
                        x={groupX + barGap / 2 + barWidth / 2}
                        y={PAD.top + chartH - expenseH - 8}
                        textAnchor="middle"
                        className="font-['JetBrains_Mono',monospace] font-bold"
                        fontSize="9"
                        fill={isHovered ? '#F43F5E' : '#6B7280'}
                        style={{ transition: 'fill 0.3s' }}
                      >
                        {d.expense >= 1000000
                          ? `$${(d.expense / 1000000).toFixed(1)}M`
                          : d.expense >= 1000
                            ? `$${Math.round(d.expense / 1000)}K`
                            : `$${d.expense}`}
                      </text>
                    )}

                    {/* Month label */}
                    <text
                      x={groupX}
                      y={H - 8}
                      textAnchor="middle"
                      className="text-[10px] font-['JetBrains_Mono',monospace] font-bold uppercase"
                      fill={isHovered ? '#9CA3AF' : '#4B5563'}
                      style={{ transition: 'fill 0.3s' }}
                    >
                      {d.label}
                    </text>

                    {/* Invisible hitbox */}
                    <rect
                      x={groupX - barGroupWidth / 2}
                      y={PAD.top}
                      width={barGroupWidth}
                      height={chartH + 20}
                      fill="transparent"
                    />
                  </g>
                )
              })}
            </svg>

            {/* Tooltip */}
            {hoverIndex !== null && data[hoverIndex] && (
              <div className="absolute top-6 right-6 bg-black/90 border border-white/20 p-4 rounded-2xl shadow-2xl pointer-events-none z-10 min-w-[180px]">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">
                  {data[hoverIndex].label}
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                      <span className="text-xs text-gray-400">Ingresos</span>
                    </div>
                    <span className="text-sm font-bold text-[#10B981] font-['Plus_Jakarta_Sans',sans-serif]">
                      {formatCurrency(data[hoverIndex].income)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="text-xs text-gray-400">Gastos</span>
                    </div>
                    <span className="text-sm font-bold text-rose-500 font-['Plus_Jakarta_Sans',sans-serif]">
                      {formatCurrency(data[hoverIndex].expense)}
                    </span>
                  </div>
                  <div className="h-px bg-white/10 my-1" />
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-xs text-gray-500 font-bold">Diferencia</span>
                    <span className={`text-sm font-bold font-['Plus_Jakarta_Sans',sans-serif] ${
                      data[hoverIndex].income - data[hoverIndex].expense >= 0
                        ? 'text-[#10B981]'
                        : 'text-rose-500'
                    }`}>
                      {data[hoverIndex].income - data[hoverIndex].expense >= 0 ? '+' : ''}
                      {formatCurrency(data[hoverIndex].income - data[hoverIndex].expense)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
