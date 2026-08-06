import { useState, useEffect, useCallback, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as Dialog from "@radix-ui/react-dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Plus,
  CreditCard as CreditCardIcon,
  X,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Wifi,
  Trash2,
} from "lucide-react";
import { formatCurrency, cn, parseLocalDate } from "@/lib/utils";
import { DatePicker } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type {
  CreditCard,
  CreditCardPurchase,
  CardIntelligence,
  CardRecommendation,
  CardPurchaseAnalytics,
} from "../../../../shared/types";

// ── Schemas ───────────────────────────────────────────────────────────────────
const BENEFIT_TYPE_OPTIONS = [
  { value: "CASHBACK", label: "Cashback" },
  { value: "MILES", label: "Millas" },
  { value: "POINTS", label: "Puntos" },
  { value: "DISCOUNTS", label: "Descuentos" },
] as const;

const STATUS_LABEL: Record<CardIntelligence["status"], string> = {
  EXCELLENT: "Excelente momento",
  GOOD: "Buen momento",
  NORMAL: "Momento normal",
  AVOID: "Evita comprar",
};

const STATUS_BADGE_CLASS: Record<CardIntelligence["status"], string> = {
  EXCELLENT: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  GOOD: "bg-sky-500/15 text-sky-400 border-sky-500/20",
  NORMAL: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  AVOID: "bg-rose-500/15 text-rose-400 border-rose-500/20",
};

const cardSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  bank: z.string().min(1, "Banco requerido"),
  totalLimit: z.coerce.number().positive("Debe ser positivo"),
  cutDay: z.coerce.number().min(1).max(31),
  paymentDay: z.coerce.number().min(1).max(31),
  annualRate: z.coerce.number().min(0).max(200).default(0),
  color: z.string().default("#6366f1"),
  franchise: z.string().optional(),
  cashbackPercent: z.coerce.number().min(0).max(100).optional(),
  benefitTypes: z
    .array(z.enum(["CASHBACK", "MILES", "POINTS", "DISCOUNTS"]))
    .optional(),
  benefitCategories: z.string().optional(),
});

const purchaseSchema = z.object({
  description: z.string().min(1, "Descripción requerida"),
  amount: z.coerce.number().positive("Monto requerido"),
  date: z.string().min(1, "Fecha requerida"),
  installments: z.coerce.number().int().min(1).max(36).default(1),
  isAdvance: z.boolean().default(false),
});

type CardFormData = z.infer<typeof cardSchema>;
type PurchaseFormData = z.infer<typeof purchaseSchema>;

// ── Card Form Modal ────────────────────────────────────────────────────────────
function CardFormModal({ onSuccess }: { onSuccess: () => void }): JSX.Element {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CardFormData>({
    resolver: zodResolver(cardSchema),
    defaultValues: { annualRate: 0, color: "#6366f1", benefitTypes: [] },
  });

  const onSubmit = async (data: CardFormData): Promise<void> => {
    setSaving(true);
    const result = await window.api.creditCards.create({
      ...data,
      benefitCategories: data.benefitCategories
        ? data.benefitCategories
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined,
    });
    setSaving(false);
    if (result.success) {
      reset();
      setOpen(false);
      onSuccess();
    }
  };

  const inputCls =
    "w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.05] transition-all";
  const labelCls =
    "text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block";

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-black font-bold text-sm rounded-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5">
          <Plus size={16} /> Nueva Tarjeta
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-md z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar bg-[#0f1115] border border-white/[0.06] rounded-[28px] p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-bold text-white tracking-tight">
              Nueva Tarjeta
            </Dialog.Title>
            <Dialog.Close className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all">
              <X size={14} />
            </Dialog.Close>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Nombre tarjeta</label>
                <input
                  {...register("name")}
                  placeholder="Visa Infinite"
                  className={inputCls}
                />
                {errors.name && (
                  <p className="text-rose-400 text-xs mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <label className={labelCls}>Banco</label>
                <input
                  {...register("bank")}
                  placeholder="Bancolombia"
                  className={inputCls}
                />
                {errors.bank && (
                  <p className="text-rose-400 text-xs mt-1">
                    {errors.bank.message}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className={labelCls}>Cupo total</label>
              <input
                {...register("totalLimit")}
                type="number"
                placeholder="5000000"
                className={inputCls}
              />
              {errors.totalLimit && (
                <p className="text-rose-400 text-xs mt-1">
                  {errors.totalLimit.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Día corte</label>
                <input
                  {...register("cutDay")}
                  type="number"
                  min="1"
                  max="31"
                  placeholder="25"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Día pago</label>
                <input
                  {...register("paymentDay")}
                  type="number"
                  min="1"
                  max="31"
                  placeholder="10"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Tasa EA %</label>
                <input
                  {...register("annualRate")}
                  type="number"
                  step="0.1"
                  placeholder="28"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Color</label>
                <input
                  {...register("color")}
                  type="color"
                  className="w-full h-10 bg-white/[0.03] border border-white/[0.08] rounded-2xl cursor-pointer"
                />
              </div>
              <div>
                <label className={labelCls}>Franquicia</label>
                <input
                  {...register("franchise")}
                  placeholder="Visa, Mastercard..."
                  className={inputCls}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Cashback %</label>
              <input
                {...register("cashbackPercent")}
                type="number"
                step="0.1"
                placeholder="1.5"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Tipo de beneficios</label>
              <Controller
                name="benefitTypes"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-wrap gap-3">
                    {BENEFIT_TYPE_OPTIONS.map((opt) => {
                      const checked = (field.value ?? []).includes(opt.value);
                      return (
                        <label
                          key={opt.value}
                          className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            className="accent-emerald-500"
                            checked={checked}
                            onChange={(e) => {
                              const current = field.value ?? [];
                              field.onChange(
                                e.target.checked
                                  ? [...current, opt.value]
                                  : current.filter((v) => v !== opt.value),
                              );
                            }}
                          />
                          {opt.label}
                        </label>
                      );
                    })}
                  </div>
                )}
              />
            </div>
            <div>
              <label className={labelCls}>
                Categorías con beneficio (separadas por coma)
              </label>
              <input
                {...register("benefitCategories")}
                placeholder="supermercados, restaurantes"
                className={inputCls}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Dialog.Close className="flex-1 h-11 rounded-2xl bg-white/5 border border-white/10 text-gray-400 text-sm font-medium hover:text-white hover:bg-white/[0.08] transition-all">
                Cancelar
              </Dialog.Close>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 h-11 rounded-2xl bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400 transition-all disabled:opacity-50 hover:-translate-y-0.5"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Purchase Form Modal ────────────────────────────────────────────────────────
function PurchaseFormModal({
  cardId,
  cardName,
  onSuccess,
}: {
  cardId: number;
  cardName: string;
  onSuccess: () => void;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [betterCard, setBetterCard] = useState<CardRecommendation | null>(null);
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: { installments: 1, isAdvance: false },
  });

  const amount = watch("amount");

  useEffect(() => {
    if (!open || !amount || amount <= 0) {
      setBetterCard(null);
      return;
    }

    const timeout = setTimeout(async () => {
      const result = await window.api.creditCards.recommendForPurchase(amount);
      if (result.success && result.data) {
        const top = result.data.find((r: CardRecommendation) => r.eligible);
        setBetterCard(top && top.cardId !== cardId ? top : null);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [amount, open, cardId]);

  const onSubmit = async (data: PurchaseFormData): Promise<void> => {
    setSaving(true);
    const result = await window.api.creditCards.addPurchase({
      cardId,
      description: data.description,
      amount: data.amount,
      date: parseLocalDate(data.date),
      installments: data.installments,
      isAdvance: data.isAdvance,
    });
    setSaving(false);
    if (result.success) {
      reset();
      setBetterCard(null);
      setOpen(false);
      onSuccess();
    }
  };

  const inputCls =
    "w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.05] transition-all";
  const labelCls =
    "text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5 block";

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] text-gray-300 text-xs rounded-2xl hover:bg-white/[0.08] transition-all border border-white/[0.06] hover:border-white/[0.12]">
          <ShoppingBag size={12} /> Registrar compra
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-md z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar bg-[#0f1115] border border-white/[0.06] rounded-[28px] p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-bold text-white tracking-tight">
              Registrar Compra
            </Dialog.Title>
            <Dialog.Close className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all">
              <X size={14} />
            </Dialog.Close>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className={labelCls}>Descripción</label>
              <input
                {...register("description")}
                placeholder="Supermercado, ropa..."
                className={inputCls}
              />
              {errors.description && (
                <p className="text-rose-400 text-xs mt-1">
                  {errors.description.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Monto</label>
                <input
                  {...register("amount")}
                  type="number"
                  placeholder="150000"
                  className={inputCls}
                />
                {errors.amount && (
                  <p className="text-rose-400 text-xs mt-1">
                    {errors.amount.message}
                  </p>
                )}
              </div>
              <div>
                <label className={labelCls}>Cuotas</label>
                <input
                  {...register("installments")}
                  type="number"
                  min="1"
                  max="36"
                  placeholder="1"
                  className={inputCls}
                />
              </div>
            </div>
            {betterCard && (
              <div className="bg-sky-500/8 border border-sky-500/20 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-xs text-sky-300">
                  💡 ¿Sabías que{" "}
                  <span className="font-bold">{betterCard.name}</span> podría
                  convenirte más para esta compra que {cardName}?
                </p>
                {betterCard.reasons[0] && (
                  <p className="text-[11px] text-sky-400/80 mt-1">
                    {betterCard.reasons[0]}
                  </p>
                )}
              </div>
            )}
            <div>
              <label className={labelCls}>Fecha</label>
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={
                      field.value ? new Date(field.value + "T00:00:00") : null
                    }
                    onChange={(d) =>
                      field.onChange(d ? format(d, "yyyy-MM-dd") : "")
                    }
                  />
                )}
              />
              {errors.date && (
                <p className="text-rose-400 text-xs mt-1">
                  {errors.date.message}
                </p>
              )}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                {...register("isAdvance")}
                type="checkbox"
                className="accent-emerald-500"
              />
              <span className="text-sm text-gray-300">
                Es avance en efectivo
              </span>
            </label>
            <div className="flex gap-3 pt-2">
              <Dialog.Close className="flex-1 h-11 rounded-2xl bg-white/5 border border-white/10 text-gray-400 text-sm font-medium hover:text-white hover:bg-white/[0.08] transition-all">
                Cancelar
              </Dialog.Close>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 h-11 rounded-2xl bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400 transition-all disabled:opacity-50 hover:-translate-y-0.5"
              >
                {saving ? "Guardando..." : "Registrar"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Utilidades visuales de tarjeta ──────────────────────────────────────────────
function seededDigits(seed: number, length: number): string {
  let x = Math.sin(seed + 1) * 10000;
  let out = "";
  for (let i = 0; i < length; i++) {
    x = Math.sin(x) * 10000;
    out += Math.floor((x - Math.floor(x)) * 10).toString();
  }
  return out;
}

function maskedCardNumber(seed: number): string {
  const last4 = seededDigits(seed, 4);
  return `•••• •••• •••• ${last4}`;
}

function fakeExpiry(seed: number): string {
  const month = (seed % 12) + 1;
  const year = 26 + (seed % 5);
  return `${String(month).padStart(2, "0")}/${year}`;
}

// ── 3D Tilt Hook ───────────────────────────────────────────────────────────────
function useTilt() {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    ref.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform =
      "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
  }, []);

  return { ref, handleMouseMove, handleMouseLeave };
}

// ── Premium Card Visual ─────────────────────────────────────────────────────────
function CardVisual({
  card,
  intelligence,
  onDelete,
  onRefresh,
}: {
  card: CreditCard;
  intelligence?: CardIntelligence;
  onDelete: () => void;
  onRefresh: () => void;
}): JSX.Element {
  const [showPurchases, setShowPurchases] = useState(false);
  const { ref: tiltRef, handleMouseMove, handleMouseLeave } = useTilt();

  const usedAmount = card.usedAmount ?? 0;
  const availableLimit = card.availableLimit ?? card.totalLimit;
  const usagePercent =
    card.totalLimit > 0 ? (usedAmount / card.totalLimit) * 100 : 0;

  let usageColor = "text-emerald-400";
  let barColor = "bg-emerald-500";
  let barGlow = "shadow-emerald-500/40";
  if (usagePercent >= 80) {
    usageColor = "text-rose-400";
    barColor = "bg-rose-500";
    barGlow = "shadow-rose-500/40";
  } else if (usagePercent >= 50) {
    usageColor = "text-amber-400";
    barColor = "bg-amber-500";
    barGlow = "shadow-amber-500/40";
  }

  const currentPeriodPurchases = (card.purchases ?? []).filter((p) => {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return p.billingPeriod === period;
  });

  // Determinar si es tarjeta "oscura" o "clara" para ajustar contraste
  const isDark = true; // Asumimos modo oscuro siempre

  return (
    <div className="flex flex-col gap-5 group/card">
      {/* 1. TARJETA FÍSICA PREMIUM CON 3D TILT */}
      <div
        ref={tiltRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-full aspect-[1.586/1] rounded-[24px] relative overflow-hidden cursor-pointer transition-transform duration-200 ease-out will-change-transform"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Fondo base con gradiente dinámico */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}dd 40%, ${card.color}88 100%)`,
          }}
        />

        {/* Patrón geométrico sutil */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Efecto holográfico / shine animado */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 55%, transparent 60%)",
            backgroundSize: "200% 200%",
            animation: "shine 4s ease-in-out infinite",
          }}
        />

        {/* Borde brillante */}
        <div
          className="absolute inset-0 rounded-[24px]"
          style={{
            border: "1.5px solid rgba(255,255,255,0.15)",
            boxShadow:
              "inset 0 1px 1px rgba(255,255,255,0.2), 0 20px 50px -10px rgba(0,0,0,0.5)",
          }}
        />

        {/* Glow de profundidad */}
        <div
          className="absolute -top-32 -right-32 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: card.color }}
        />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-black/30 rounded-full blur-3xl pointer-events-none" />

        {/* Contenido de la tarjeta */}
        <div className="relative z-10 h-full flex flex-col justify-between p-6 sm:p-7">
          {/* Fila superior: Banco + Contactless */}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-lg font-bold text-white/95 tracking-tight leading-tight drop-shadow-sm">
                {card.bank}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50 mt-0.5">
                {card.name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Wifi size={20} className="text-white/60 rotate-90" />
              <CreditCardIcon size={22} className="text-white/40" />
            </div>
          </div>

          {/* Chip EMV realista */}
          <div className="flex items-center gap-3 mt-1">
            <div className="relative w-11 h-8 rounded-md bg-gradient-to-br from-[#e6c875] via-[#d4af37] to-[#8B7355] border border-[#b8941f]/50 shadow-inner overflow-hidden">
              {/* Líneas del chip */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-[2px] p-[3px]">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-black/[0.08] rounded-[1px] border border-black/[0.04]"
                  />
                ))}
              </div>
              {/* Arco superior del chip */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-3 border-b border-black/10 rounded-b-full" />
              {/* Línea vertical central */}
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-black/5" />
            </div>
            <div className="w-6 h-5 rounded-sm border border-white/10 bg-white/5 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full border border-white/20" />
            </div>
          </div>

          {/* Número de tarjeta */}
          <div className="mt-2">
            <p
              className="text-xl sm:text-2xl font-mono font-medium tracking-[0.12em] text-white/90 drop-shadow-md"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {maskedCardNumber(card.id)}
            </p>
          </div>

          {/* Fila inferior */}
          <div className="flex justify-between items-end mt-auto">
            <div className="space-y-3">
              {/* Titular */}
              <div>
                <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-white/40 mb-0.5">
                  Titular
                </p>
                <p className="text-xs font-semibold text-white/80 tracking-wide uppercase">
                  Nombre del Titular
                </p>
              </div>

              {/* Disponible */}
              <div>
                <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-white/40 mb-0.5">
                  Disponible
                </p>
                <p className="text-xl font-extrabold tracking-tight text-white drop-shadow-lg">
                  {formatCurrency(availableLimit)}
                </p>
              </div>
            </div>

            <div className="text-right space-y-3">
              {/* Vencimiento */}
              <div>
                <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-white/40 mb-0.5">
                  Vence
                </p>
                <p
                  className="text-sm font-mono font-semibold text-white/80"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {fakeExpiry(card.id)}
                </p>
              </div>

              {/* Franquicia */}
              {card.franchise && (
                <p className="text-lg font-black italic text-white/90 tracking-tight drop-shadow-md">
                  {card.franchise}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Reflejo de luz en hover */}
        <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(125deg, transparent 30%, rgba(255,255,255,0.08) 40%, transparent 50%)",
            }}
          />
        </div>
      </div>

      {/* 2. BARRA DE USO PREMIUM */}
      <div className="px-1">
        <div className="flex justify-between items-end mb-2.5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-0.5">
              Uso del cupo
            </p>
            <p className="text-sm font-bold text-white">
              {formatCurrency(usedAmount)}{" "}
              <span className="text-gray-600 font-normal">
                / {formatCurrency(card.totalLimit)}
              </span>
            </p>
          </div>
          <span
            className={cn(
              "text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-md border",
              usagePercent >= 80
                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                : "bg-white/5 text-gray-300 border-white/10",
            )}
          >
            {usagePercent.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden backdrop-blur-sm">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-1000 ease-out shadow-lg",
              barColor,
              barGlow,
            )}
            style={{
              width: `${Math.min(usagePercent, 100)}%`,
              boxShadow: `0 0 12px currentColor`,
            }}
          />
        </div>
      </div>

      {/* 3. DETALLES ESTILO iOS PREMIUM */}
      <div className="bg-[#16181d]/90 backdrop-blur-xl border border-white/[0.05] rounded-3xl overflow-hidden shadow-xl shadow-black/40 divide-y divide-white/[0.04]">
        {/* Inteligencia */}
        {intelligence && (
          <div className="flex justify-between items-center px-5 py-4 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center border",
                  STATUS_BADGE_CLASS[intelligence.status],
                )}
              >
                <Sparkles size={15} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Recomendación</p>
                <p className="text-[11px] text-gray-400">
                  {STATUS_LABEL[intelligence.status]}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-emerald-400">
                {intelligence.financingDaysIfPurchaseToday} días
              </p>
              <p className="text-[10px] uppercase tracking-widest text-gray-600">
                Financiación
              </p>
            </div>
          </div>
        )}

        {/* Fechas */}
        <div className="flex justify-between items-center px-5 py-4 hover:bg-white/[0.02] transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <span className="text-xs font-bold">{card.cutDay}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Día de corte</p>
              <p className="text-[11px] text-gray-500">Ciclo de facturación</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-right">
            <div>
              <p className="text-sm font-bold text-white">Día de pago</p>
              <p className="text-[11px] text-gray-500">Fecha límite</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <span className="text-xs font-bold">{card.paymentDay}</span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex justify-between items-center px-5 py-3.5 bg-white/[0.01]">
          <PurchaseFormModal
            cardId={card.id}
            cardName={card.name}
            onSuccess={onRefresh}
          />
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowPurchases((v) => !v)}
              className="text-xs font-semibold text-gray-400 hover:text-white transition-all flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.08] px-3.5 py-2 rounded-full border border-white/[0.06]"
            >
              {currentPeriodPurchases.length} compras{" "}
              {showPurchases ? (
                <ChevronUp size={12} />
              ) : (
                <ChevronDown size={12} />
              )}
            </button>
            <button
              onClick={async () => {
                await window.api.creditCards.delete(card.id);
                onDelete();
              }}
              className="w-9 h-9 rounded-full bg-rose-500/8 text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/15 flex items-center justify-center transition-all border border-rose-500/10 hover:border-rose-500/20"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Compras desplegables */}
        {showPurchases && currentPeriodPurchases.length > 0 && (
          <div className="bg-black/20 divide-y divide-white/[0.04]">
            {currentPeriodPurchases.map((p: CreditCardPurchase) => (
              <div
                key={p.id}
                className="flex justify-between items-center px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm text-gray-200 font-medium truncate">
                    {p.description}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
                    {p.installments > 1
                      ? `${p.installments} Cuotas`
                      : "Contado"}{" "}
                    {p.isAdvance && (
                      <span className="text-amber-500 ml-1.5 font-bold">
                        • AVANCE
                      </span>
                    )}
                  </p>
                </div>
                <p className="text-sm font-bold text-white ml-4 shrink-0">
                  {formatCurrency(p.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Animación shine global */}
      <style>{`
        @keyframes shine {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  );
}

// ── Centro de oportunidades ──────────────────────────────────────────────────────
function OpportunityCenter({
  intelligence,
}: {
  intelligence: CardIntelligence[];
}): JSX.Element | null {
  const goodMoment = intelligence.filter(
    (c) => c.status === "EXCELLENT" || c.status === "GOOD",
  );
  const nextCut = [...intelligence].sort(
    (a, b) => a.daysUntilCut - b.daysUntilCut,
  )[0];
  const nextPayment = [...intelligence].sort(
    (a, b) => a.daysUntilPayment - b.daysUntilPayment,
  )[0];

  if (intelligence.length === 0) return null;

  return (
    <div className="bg-[#121418] border border-white/[0.06] rounded-[28px] p-8 mb-6 shadow-xl shadow-black/20">
      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-5">
        Centro de oportunidades
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-5 hover:bg-white/[0.04] transition-colors">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
            Hoy puedes aprovechar
          </p>
          {goodMoment.length === 0 ? (
            <p className="text-xs text-gray-600">
              Ninguna tarjeta está en buen momento hoy
            </p>
          ) : (
            <div className="space-y-2.5">
              {goodMoment.map((c) => (
                <div
                  key={c.cardId}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-white font-medium flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                    {c.name}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    {c.financingDaysIfPurchaseToday} días
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-5 hover:bg-white/[0.04] transition-colors">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
            Próximo corte
          </p>
          {nextCut && (
            <div>
              <p className="text-sm text-white font-medium">{nextCut.name}</p>
              <p className="text-xs text-gray-400 mt-1">
                {nextCut.daysUntilCut === 0
                  ? "Hoy"
                  : `En ${nextCut.daysUntilCut} día${nextCut.daysUntilCut === 1 ? "" : "s"}`}
              </p>
            </div>
          )}
        </div>
        <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-5 hover:bg-white/[0.04] transition-colors">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
            Próximo pago
          </p>
          {nextPayment && (
            <div>
              <p className="text-sm text-white font-medium">
                {nextPayment.name}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {nextPayment.daysUntilPayment === 0
                  ? "Hoy"
                  : `En ${nextPayment.daysUntilPayment} día${nextPayment.daysUntilPayment === 1 ? "" : "s"}`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Análisis histórico ────────────────────────────────────────────────────────────
function AnalyticsSummary({
  analytics,
}: {
  analytics: CardPurchaseAnalytics;
}): JSX.Element | null {
  if (analytics.totalPurchases === 0) return null;

  return (
    <div className="bg-[#121418] border border-white/[0.06] rounded-[28px] p-8 mb-6 shadow-xl shadow-black/20">
      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-1">
        Análisis histórico
      </h3>
      <p className="text-[11px] text-gray-600 mb-5">
        Compras de los últimos {analytics.periodMonths} meses
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-5 hover:bg-white/[0.04] transition-colors group">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
            Financiación promedio
          </p>
          <p className="text-3xl font-bold text-white tracking-tight group-hover:scale-105 transition-transform origin-left">
            {analytics.avgFinancingDays}{" "}
            <span className="text-lg text-gray-500 font-medium">días</span>
          </p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-5 hover:bg-white/[0.04] transition-colors group">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
            Compras en buen momento
          </p>
          <p className="text-3xl font-bold text-emerald-400 tracking-tight group-hover:scale-105 transition-transform origin-left">
            {analytics.goodMomentPercent}%
          </p>
          <p className="text-[11px] text-gray-600 mt-1">
            {analytics.goodMomentPurchases} de {analytics.totalPurchases}{" "}
            compras
          </p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-5 hover:bg-white/[0.04] transition-colors group">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
            Compras cerca del corte
          </p>
          <p className="text-3xl font-bold text-rose-400 tracking-tight group-hover:scale-105 transition-transform origin-left">
            {analytics.avoidMomentPurchases}
          </p>
          <p className="text-[11px] text-gray-600 mt-1">
            perdieron días de financiación
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Comparador de tarjetas ──────────────────────────────────────────────────────
function CardComparator({
  intelligence,
}: {
  intelligence: CardIntelligence[];
}): JSX.Element {
  const sorted = [...intelligence].sort(
    (a, b) => b.financingDaysIfPurchaseToday - a.financingDaysIfPurchaseToday,
  );
  const bestId = sorted[0]?.cardId;

  return (
    <div className="bg-[#121418] border border-white/[0.06] rounded-[28px] p-8 mb-6 shadow-xl shadow-black/20">
      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-5">
        Comparador de tarjetas
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b border-white/[0.06]">
              <th className="pb-3 pr-4">Tarjeta</th>
              <th className="pb-3 pr-4">Días para pagar</th>
              <th className="pb-3 pr-4">Cashback</th>
              <th className="pb-3">Recomendación</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((card) => (
              <tr
                key={card.cardId}
                className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-3 pr-4 text-white font-medium">
                  {card.name}
                </td>
                <td className="py-3 pr-4 text-gray-300 font-mono">
                  {card.financingDaysIfPurchaseToday}
                </td>
                <td className="py-3 pr-4 text-gray-300">
                  {card.cashbackPercent > 0 ? `${card.cashbackPercent}%` : "—"}
                </td>
                <td className="py-3">
                  {card.cardId === bestId ? (
                    <span className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                      <Sparkles size={12} /> Mejor opción
                    </span>
                  ) : (
                    <Badge className={STATUS_BADGE_CLASS[card.status]}>
                      {STATUS_LABEL[card.status]}
                    </Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Asistente de compras ─────────────────────────────────────────────────────────
function PurchaseAssistantModal(): JSX.Element {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<
    CardRecommendation[] | null
  >(null);

  const onSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const value = Number(amount);
    if (!(value > 0)) return;
    setLoading(true);
    const result = await window.api.creditCards.recommendForPurchase(value);
    setLoading(false);
    if (result.success && result.data) setRecommendations(result.data);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setRecommendations(null);
          setAmount("");
        }
      }}
    >
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.05] text-gray-200 font-bold text-sm rounded-2xl hover:bg-white/[0.1] transition-all border border-white/[0.08] hover:border-white/[0.15] hover:-translate-y-0.5">
          <Sparkles size={16} className="text-amber-400" /> Asistente de compras
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-md z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar bg-[#0f1115] border border-white/[0.06] rounded-[28px] p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-bold text-white tracking-tight">
              Asistente de compras
            </Dialog.Title>
            <Dialog.Close className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all">
              <X size={14} />
            </Dialog.Close>
          </div>
          <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Monto de la compra"
              className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-2xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.05] transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 rounded-2xl bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400 transition-all disabled:opacity-50 hover:-translate-y-0.5"
            >
              {loading ? "..." : "Analizar"}
            </button>
          </form>

          {recommendations && (
            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
              {recommendations.map((rec, idx) => (
                <div
                  key={rec.cardId}
                  className={cn(
                    "bg-white/[0.03] rounded-2xl p-4 border transition-all hover:bg-white/[0.05]",
                    idx === 0 && rec.eligible
                      ? "border-emerald-500/30 shadow-lg shadow-emerald-500/5"
                      : "border-white/[0.05]",
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-bold text-white">
                      {idx === 0 && rec.eligible && (
                        <Sparkles
                          size={14}
                          className="inline text-amber-400 mr-1 -mt-0.5"
                        />
                      )}
                      {rec.name}{" "}
                      <span className="text-gray-500 font-normal">
                        ({rec.bank})
                      </span>
                    </p>
                    {!rec.eligible && (
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                        SIN CUPO
                      </span>
                    )}
                  </div>
                  <ul className="space-y-1.5">
                    {rec.reasons.map((reason, i) => (
                      <li
                        key={i}
                        className="text-xs text-gray-400 flex items-start gap-1.5"
                      >
                        <span className="text-emerald-500 mt-0.5">✓</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export function CreditCardsPage(): JSX.Element {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [intelligence, setIntelligence] = useState<CardIntelligence[]>([]);
  const [analytics, setAnalytics] = useState<CardPurchaseAnalytics | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    const result = await window.api.creditCards.getAll();
    if (result.success && result.data) {
      const now = new Date();
      const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const enriched = (result.data as CreditCard[]).map((card) => {
        const periodPurchases = (card.purchases ?? []).filter(
          (p) => p.billingPeriod === period,
        );
        const usedAmount = periodPurchases.reduce((s, p) => s + p.amount, 0);
        return {
          ...card,
          usedAmount,
          availableLimit: Math.max(card.totalLimit - usedAmount, 0),
        };
      });
      setCards(enriched);
    }

    const intelligenceResult =
      await window.api.creditCards.getAllIntelligence();
    if (intelligenceResult.success && intelligenceResult.data) {
      setIntelligence(intelligenceResult.data);
    }

    const analyticsResult = await window.api.creditCards.getPurchaseAnalytics();
    if (analyticsResult.success && analyticsResult.data) {
      setAnalytics(analyticsResult.data);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="w-8 h-8 border-[3px] border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-4 sm:px-6 lg:px-12 py-6 sm:py-8 shrink-0 flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.05] bg-[#08090B]/90 backdrop-blur-xl sticky top-0 z-10">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-500 mb-2">
            Módulo
          </p>
          <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Tarjetas de Crédito
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {cards.length > 0 && <PurchaseAssistantModal />}
          <CardFormModal onSuccess={load} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-8 custom-scrollbar">
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-emerald-500/5 rounded-full flex items-center justify-center mb-5 border border-emerald-500/10 relative">
              <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl" />
              <CreditCardIcon
                size={32}
                className="text-emerald-500/60 relative z-10"
              />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Sin tarjetas registradas
            </h3>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              Registra tus tarjetas de crédito para controlar el cupo disponible
              y las compras del período.
            </p>
          </div>
        ) : (
          <>
            {intelligence.length >= 1 && (
              <OpportunityCenter intelligence={intelligence} />
            )}
            {analytics && <AnalyticsSummary analytics={analytics} />}
            {intelligence.length >= 2 && (
              <CardComparator intelligence={intelligence} />
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 pb-8">
              {cards.map((card) => (
                <CardVisual
                  key={card.id}
                  card={card}
                  intelligence={intelligence.find((i) => i.cardId === card.id)}
                  onDelete={load}
                  onRefresh={load}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
