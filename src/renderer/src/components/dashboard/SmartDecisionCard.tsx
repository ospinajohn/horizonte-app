import { Lightbulb, ArrowRight } from 'lucide-react'

interface SmartDecisionCardProps {
  onNavigate?: () => void
}

export function SmartDecisionCard({ onNavigate }: SmartDecisionCardProps): JSX.Element {
  return (
    <div className="col-span-12 lg:col-span-6 bg-[#121418] border border-white/5 rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.2)] p-10 flex flex-col justify-center relative overflow-hidden">
      <div className="flex items-center gap-6">
        {/* Icon */}
        <div className="w-16 h-16 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-500 border border-pink-500/20 shrink-0">
          <Lightbulb size={28} />
        </div>

        {/* Text */}
        <div className="flex-1">
          <h4 className="text-xl font-['Plus_Jakarta_Sans',sans-serif] font-bold mb-1">
            Smart Decision: "¿Puedo comprar esto?"
          </h4>
          <p className="text-sm text-gray-500">
            El asistente analiza tu futuro flujo de caja antes de que gastes hoy.
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={onNavigate}
          className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shrink-0"
          aria-label="Ir al centro de decisiones"
        >
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  )
}
