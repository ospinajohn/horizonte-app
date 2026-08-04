import { useState, useEffect, useCallback, useRef } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { DecisionAnswer } from '../../../../shared/types'

// ── Suggested questions ───────────────────────────────────────────────────────
const SUGGESTED: string[] = [
  '¿Cuánto puedo gastar hoy?',
  '¿Cuándo podré cumplir mi meta?',
  '¿Puedo asumir un nuevo crédito?',
  '¿Qué pasa si renuncio?',
  '¿Cuánto tendré la próxima quincena?',
  '¿Estoy ahorrando suficiente?'
]

// ── Verdict badge ─────────────────────────────────────────────────────────────
function VerdictBadge({ verdict }: { verdict: DecisionAnswer['verdict'] }): JSX.Element {
  const config = {
    YES: { label: '✅ SÍ', color: '#10B981', bg: '#10B98115', border: '#10B98140' },
    NO: { label: '❌ NO', color: '#F43F5E', bg: '#F43F5E15', border: '#F43F5E40' },
    CONDITIONAL: { label: '⚠️ CON CONDICIONES', color: '#F59E0B', bg: '#F59E0B15', border: '#F59E0B40' },
    INFO: { label: 'ℹ️ INFORMACIÓN', color: '#60A5FA', bg: '#60A5FA15', border: '#60A5FA40' }
  }
  const c = config[verdict]
  return (
    <span
      className="text-xs font-bold px-3 py-1.5 rounded-full border"
      style={{ color: c.color, background: c.bg, borderColor: c.border }}
    >
      {c.label}
    </span>
  )
}

// ── History query item ────────────────────────────────────────────────────────
function HistoryItem({ query }: {
  query: { id: number; question: string; answer: string; context: string | null; createdAt: Date }
}): JSX.Element {
  let verdict: DecisionAnswer['verdict'] = 'INFO'
  try {
    const ctx = query.context ? JSON.parse(query.context) : {}
    if (ctx.verdict) verdict = ctx.verdict
  } catch {
    // ignore
  }

  return (
    <div className="bg-[#0F1115] border border-white/5 rounded-2xl p-4 space-y-2">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-white font-bold">{query.question}</p>
        <VerdictBadge verdict={verdict} />
      </div>
      <p className="text-xs text-gray-500 line-clamp-2">{query.answer}</p>
      <p className="text-[10px] text-gray-700 font-['JetBrains_Mono',monospace]">
        {formatDistanceToNow(new Date(query.createdAt), { addSuffix: true, locale: es })}
      </p>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export function DecisionCenterPage(): JSX.Element {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<DecisionAnswer | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadHistory = useCallback(async () => {
    try {
      const res = await window.api.decisionCenter.getHistory()
      if (res.success && res.data) setHistory(res.data)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  const handleAsk = async (q?: string): Promise<void> => {
    const finalQ = q ?? question
    if (!finalQ.trim()) return
    setLoading(true)
    setAnswer(null)
    try {
      const res = await window.api.decisionCenter.answer(finalQ)
      if (res.success && res.data) {
        setAnswer(res.data)
        await window.api.decisionCenter.saveQuery(finalQ, res.data)
        loadHistory()
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleSuggested = (q: string): void => {
    setQuestion(q)
    handleAsk(q)
  }

  const verdictBgColor = answer ? {
    YES: '#10B98108',
    NO: '#F43F5E08',
    CONDITIONAL: '#F59E0B08',
    INFO: '#60A5FA08'
  }[answer.verdict] : 'transparent'

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-[900px] mx-auto p-12 space-y-8">

        {/* Header */}
        <div>
          <p className="text-[10px] font-bold text-[#10B981] uppercase tracking-[0.4em]">
            FASE 3 // COPILOTO FINANCIERO
          </p>
          <h1 className="text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold tracking-tight text-white mt-1">
            Centro de Decisiones
          </h1>
          <p className="text-sm text-gray-500 mt-2 max-w-xl">
            Responde con datos reales de tus cuentas, transacciones y presupuestos — no es un chat genérico. Cuantas más transacciones tengas registradas, más precisas serán las respuestas.
          </p>
        </div>

        {/* Preguntas sugeridas */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">
            PREGUNTAS FRECUENTES
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SUGGESTED.map((q) => (
              <button
                key={q}
                onClick={() => handleSuggested(q)}
                className="text-left text-sm text-gray-400 bg-[#0F1115] border border-white/5 hover:border-[#10B981]/30 hover:text-white rounded-2xl px-5 py-4 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="bg-[#121418] border border-white/5 rounded-[28px] p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
            O ESCRIBE TU PROPIA PREGUNTA
          </p>
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAsk() }}
              placeholder="Escribe tu pregunta financiera..."
              className="flex-1 bg-[#0F1115] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#10B981]/50 transition-all"
            />
            <button
              onClick={() => handleAsk()}
              disabled={loading || !question.trim()}
              className="w-14 h-14 bg-[#10B981] text-black rounded-2xl flex items-center justify-center disabled:opacity-40 hover:bg-[#3EB489] transition-all shrink-0"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowRight size={20} />
              )}
            </button>
          </div>
        </div>

        {/* Respuesta */}
        {answer && (
          <div
            className="bg-[#121418] border border-white/5 rounded-[28px] p-10 space-y-8"
            style={{ background: `linear-gradient(135deg, #121418 0%, ${verdictBgColor} 100%)` }}
          >
            {/* Verdict + respuesta principal */}
            <div className="space-y-4">
              <VerdictBadge verdict={answer.verdict} />
              <p className="text-xl font-bold text-white font-['Plus_Jakarta_Sans',sans-serif] leading-relaxed">
                {answer.answer}
              </p>
            </div>

            {/* Números clave */}
            {answer.numbers.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {answer.numbers.map((n, i) => (
                  <div key={i} className="bg-[#0F1115] border border-white/5 rounded-2xl p-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                      {n.label}
                    </p>
                    <p className="text-lg font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">
                      {n.value}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Detalles */}
            {answer.details.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">DETALLES</p>
                <ul className="space-y-2">
                  {answer.details.map((d, i) => (
                    <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                      <span className="text-gray-700 mt-0.5">▸</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recomendación final */}
            {answer.recommendation && (
              <div className="border-t border-white/5 pt-6">
                <p className="text-sm text-gray-400 italic leading-relaxed">
                  💡 {answer.recommendation}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Historial colapsable */}
        {history.length > 0 && (
          <div className="bg-[#121418] border border-white/5 rounded-[28px] overflow-hidden">
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="w-full flex items-center justify-between p-8 text-left hover:bg-white/2 transition-all"
            >
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  HISTORIAL DE CONSULTAS
                </p>
                <p className="text-sm text-gray-600 mt-1">{history.length} consultas recientes</p>
              </div>
              {showHistory ? (
                <ChevronUp size={18} className="text-gray-600" />
              ) : (
                <ChevronDown size={18} className="text-gray-600" />
              )}
            </button>
            {showHistory && (
              <div className="px-8 pb-8 space-y-3 border-t border-white/5 pt-6">
                {history.slice(0, 10).map((q) => (
                  <HistoryItem key={q.id} query={q} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
