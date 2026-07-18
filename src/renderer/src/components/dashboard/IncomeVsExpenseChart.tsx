import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: ValueType; name: NameType }>;
  label?: string;
}

interface MonthData {
  label: string;
  income: number;
  expense: number;
}

interface IncomeVsExpenseChartProps {
  data: MonthData[];
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const income =
      (payload.find((p) => p.dataKey === "income")?.value as number) || 0;
    const expense =
      (payload.find((p) => p.dataKey === "expense")?.value as number) || 0;
    const diff = income - expense;

    return (
      <div className="bg-black/90 border border-white/20 p-4 rounded-2xl shadow-2xl pointer-events-none min-w-[180px]">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">
          {label}
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span className="text-xs text-gray-400">Ingresos</span>
            </div>
            <span className="text-sm font-bold text-[#10B981] font-['Plus_Jakarta_Sans',sans-serif]">
              {formatCurrency(income)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-xs text-gray-400">Gastos</span>
            </div>
            <span className="text-sm font-bold text-rose-500 font-['Plus_Jakarta_Sans',sans-serif]">
              {formatCurrency(expense)}
            </span>
          </div>
          <div className="h-px bg-white/10 my-1" />
          <div className="flex items-center justify-between gap-6">
            <span className="text-xs text-gray-500 font-bold">Diferencia</span>
            <span
              className={`text-sm font-bold font-['Plus_Jakarta_Sans',sans-serif] ${
                diff >= 0 ? "text-[#10B981]" : "text-rose-500"
              }`}
            >
              {diff >= 0 ? "+" : ""}
              {formatCurrency(diff)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const formatAxisValue = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${Math.round(value / 1000)}K`;
  return `$${value}`;
};

// labelColor es prop propia — Recharts inyecta su propio `fill`
// (que ahora será "url(#...)" por los gradientes) y no queremos depender de él.
// activeIndex controla que el label solo resalte en el grupo bajo hover.
const CustomBarLabel = (props: any) => {
  const { x, y, width, value, index, labelColor, activeIndex } = props;
  if (!value) return null;

  const isActive = activeIndex === index;

  return (
    <text
      x={x + width / 2}
      y={y - 8}
      fill={isActive ? labelColor : "#6B7280"}
      opacity={isActive ? 1 : 0.5}
      textAnchor="middle"
      className="font-['JetBrains_Mono',monospace] font-bold text-[9px]"
      style={{ transition: "fill 0.3s, opacity 0.3s" }}
    >
      {formatAxisValue(value)}
    </text>
  );
};

export function IncomeVsExpenseChart({
  data,
}: IncomeVsExpenseChartProps): JSX.Element {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const hasData =
    data.length > 0 && data.some((d) => d.income > 0 || d.expense > 0);

  // Promedio solo de meses con ingresos registrados, para que los meses
  // vacíos (Feb, Mar) no arrastren la línea de referencia hacia abajo.
  const monthsWithIncome = data.filter((d) => d.income > 0);
  const avgIncome =
    monthsWithIncome.length > 0
      ? monthsWithIncome.reduce((s, d) => s + d.income, 0) /
        monthsWithIncome.length
      : 0;

  return (
    <div className="col-span-12 lg:col-span-9 bg-[#121418] border border-white/5 rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.2)] p-8 flex flex-col h-full min-h-[350px]">
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
      <div className="flex-1 w-full relative bg-black/20 rounded-[32px] border border-white/5 overflow-hidden px-6 pt-10 pb-4 min-h-[220px]">
        {!hasData ? (
          <div className="h-full w-full flex flex-col items-center justify-center text-center">
            <p className="text-sm text-gray-500 mb-1">Sin datos suficientes</p>
            <p className="text-xs text-gray-600">
              Registra transacciones en los últimos meses para ver la
              comparativa
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
              barGap={4}
              onMouseMove={(state) => {
                setActiveIndex(
                  state?.isTooltipActive
                    ? (state.activeTooltipIndex as number)
                    : null,
                );
              }}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {/* Gradientes: opacidad plena arriba, se desvanecen hacia la base
                  para integrarse con el fondo oscuro en vez de "flotar" */}
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.4} />
                </linearGradient>
                <linearGradient
                  id="expenseGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#F43F5E" stopOpacity={1} />
                  <stop offset="100%" stopColor="#F43F5E" stopOpacity={0.4} />
                </linearGradient>
              </defs>

              <CartesianGrid
                vertical={false}
                stroke="rgba(255,255,255,0.04)"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "#4B5563",
                  fontSize: 10,
                  fontFamily: "JetBrains Mono",
                  fontWeight: "bold",
                }}
                dy={10}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(255,255,255,0.02)" }}
              />

              {/* Línea de referencia: promedio de ingresos de meses con actividad */}
              {avgIncome > 0 && (
                <ReferenceLine
                  y={avgIncome}
                  stroke="rgba(16,185,129,0.3)"
                  strokeDasharray="6 4"
                  label={{
                    value: "Promedio",
                    fill: "#6B7280",
                    fontSize: 9,
                    position: "insideTopRight",
                  }}
                />
              )}

              <Bar
                dataKey="income"
                fill="url(#incomeGradient)"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
                animationDuration={800}
                animationEasing="ease-out"
                activeBar={{
                  filter: "drop-shadow(0 0 8px rgba(16,185,129,0.6))",
                }}
                label={
                  <CustomBarLabel
                    labelColor="#10B981"
                    activeIndex={activeIndex}
                  />
                }
              />
              <Bar
                dataKey="expense"
                fill="url(#expenseGradient)"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
                animationDuration={800}
                animationEasing="ease-out"
                activeBar={{
                  filter: "drop-shadow(0 0 8px rgba(244,63,94,0.6))",
                }}
                label={
                  <CustomBarLabel
                    labelColor="#F43F5E"
                    activeIndex={activeIndex}
                  />
                }
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
