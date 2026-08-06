"use client";

import * as React from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Input                                                               */
/* ------------------------------------------------------------------ */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <span className="absolute left-3.5 text-gray-600 pointer-events-none flex items-center">
            {leftIcon}
          </span>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-2xl border border-white/5 bg-white/5",
            "px-4 py-2 text-sm text-white placeholder:text-gray-600",
            "transition-colors",
            "focus:outline-none focus:border-[#10B981]/50 focus:bg-white/[0.07]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            className,
          )}
          ref={ref}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3.5 text-gray-600 pointer-events-none flex items-center">
            {rightIcon}
          </span>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };

/* ------------------------------------------------------------------ */
/* Utilidades de fecha (sin dependencias)                              */
/* ------------------------------------------------------------------ */

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];
const DIAS = ["LU", "MA", "MI", "JU", "VI", "SA", "DO"];

function isSameDay(a?: Date | null, b?: Date | null) {
  return (
    !!a &&
    !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDate(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** Genera la grilla de 6 semanas (42 celdas) empezando en lunes */
function getCalendarDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  // getDay(): 0=domingo... convertimos a lunes-first
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

/* ------------------------------------------------------------------ */
/* DatePicker                                                          */
/* ------------------------------------------------------------------ */

export interface DatePickerProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Selecciona una fecha",
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [view, setView] = React.useState(() => {
    const d = value ?? new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const rootRef = React.useRef<HTMLDivElement>(null);
  const today = new Date();

  // Cerrar al hacer click afuera o presionar Escape
  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const days = getCalendarDays(view.year, view.month);

  const navigate = (delta: number) => {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const select = (d: Date) => {
    onChange?.(d);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      {/* Trigger — misma estética que tus <Input> */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-2xl",
          "border border-white/5 bg-white/5 px-4 text-sm transition-colors",
          "focus:outline-none focus:border-[#10B981]/50 focus:bg-white/[0.07]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          open && "border-[#10B981]/50 bg-white/[0.07]",
        )}
      >
        <span className={value ? "text-white" : "text-gray-600"}>
          {value ? formatDate(value) : placeholder}
        </span>
        <CalendarIcon
          size={15}
          className={cn(
            "shrink-0 transition-colors",
            open ? "text-[#10B981]" : "text-gray-500",
          )}
        />
      </button>

      {/* Popover */}
      {open && (
        <div
          className={cn(
            "absolute left-0 top-[calc(100%+8px)] z-50 w-[300px] p-4",
            "rounded-2xl border border-white/10 bg-[#16181D]",
            "shadow-[0_16px_48px_-8px_rgba(0,0,0,0.7)]",
            "animate-in fade-in-0 zoom-in-95 duration-150 origin-top-left",
          )}
        >
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-white capitalize">
              {MESES[view.month]} {view.year}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Mes anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => navigate(1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Mes siguiente"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Días de la semana */}
          <div className="mb-1 grid grid-cols-7">
            {DIAS.map((d) => (
              <span
                key={d}
                className="flex h-8 items-center justify-center text-[10px] font-medium tracking-wider text-gray-600"
              >
                {d}
              </span>
            ))}
          </div>

          {/* Grilla de días */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {days.map((d, i) => {
              const outside = d.getMonth() !== view.month;
              const selected = isSameDay(d, value);
              const isToday = isSameDay(d, today);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => select(d)}
                  className={cn(
                    "relative mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-xs transition-colors",
                    outside ? "text-gray-700" : "text-gray-300",
                    !selected && "hover:bg-white/5 hover:text-white",
                    selected &&
                      "bg-[#10B981] font-semibold text-black shadow-[0_0_16px_-2px_rgba(16,185,129,0.5)]",
                    isToday && !selected && "text-[#10B981] font-semibold",
                  )}
                >
                  {d.getDate()}
                  {isToday && !selected && (
                    <span className="absolute bottom-1 h-0.5 w-0.5 rounded-full bg-[#10B981]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
            <button
              type="button"
              onClick={() => {
                onChange?.(null);
                setOpen(false);
              }}
              className="text-xs text-gray-500 transition-colors hover:text-white"
            >
              Borrar
            </button>
            <button
              type="button"
              onClick={() => {
                setView({ year: today.getFullYear(), month: today.getMonth() });
                select(today);
              }}
              className="text-xs font-medium text-[#10B981] transition-colors hover:text-[#34D399]"
            >
              Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
