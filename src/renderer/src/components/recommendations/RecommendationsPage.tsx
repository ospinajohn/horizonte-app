import { useState, useEffect, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { Lightbulb, RefreshCw } from 'lucide-react'
import type { RecommendationLog } from '../../../../shared/types'

type Tab = 'all' | 'pending' | 'applied'

function typeIcon(type: RecommendationLog['type']): string {
  const map: Record<string, string> = {
    SAVINGS: '💰',
    DEBT_OPTIMIZATION: '⚖️',
    TIMING: '⏰',
    INVESTMENT: '📈',
    OTHER: '💡'
  }
  return map[type] ?? '💡'
}

function typeColor(type: RecommendationLog['type']): string {
  const map: Record<string, string> = {
    SAVINGS: '#10B981',
    DEBT_OPTIMIZATION: '#60A5FA',
    TIMING: '#F59E0B',
    INVESTMENT: '#A78BFA',
    OTHER: '#6B7280'
  }
  return map[type] ?? '#6B7280'
}

export function RecommendationsPage(): JSX.Element {
  const [items, setItems] = useState<RecommendationLog[]>([])
  const [tab, setTab] = useState<Tab>('all')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const navigate = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await window.api.recommendations.getAll()
      if (res.success && res.data) setItems(res.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleGenerate = async (): Promise<void> => {
    setGenerating(true)
    try {
      const res = await window.api.recommendations.generate()
      if (res.success && res.data) setItems(res.data)
    } catch {
      // ignore
    } finally {
      setGenerating(false)
    }
  }

  const handleMarkApplied = async (id: number): Promise<void> => {
    await window.api.recommendations.markApplied(id)
    setItems((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isApplied: true, isRead: true } : r))
    )
  }

  const handleMarkRead = async (id: number): Promise<void> => {
    await window.api.recommendations.markRead(id)
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, isRead: true } : r)))
  }

  const filtered = items.filter((r) => {
    if (tab === 'pending') return !r.isApplied
    if (tab === 'applied') return r.isApplied
    return true
  })

  const tabs: { id: Tab; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'pending', label: 'Pendientes' },
    { id: 'applied', label: 'Aplicadas' }
  ]

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-[1000px] mx-auto p-12 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold text-[#10B981] uppercase tracking-[0.4em]">
              FASE 3 // INTELIGENCIA FINANCIERA
            </p>
            <h1 className="text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold tracking-tight text-white mt-1">
              Recomendaciones
            </h1>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 bg-[#10B981] text-black font-bold px-5 py-3 rounded-2xl text-sm disabled:opacity-50 transition-all hover:bg-[#3EB489]"
          >
            <RefreshCw size={16} className={generating ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#0F1115] border border-white/5 rounded-2xl p-1 w-fit">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                tab === t.id ? 'bg-[#10B981] text-black' : 'text-gray-500 hover:text-white'
              }`}
            >
              {t.label}
              {t.id === 'pending' && (
                <span className="ml-1.5 bg-white/10 text-xs px-1.5 py-0.5 rounded-full">
                  {items.filter((r) => !r.isApplied).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-gray-600 text-sm">Cargando...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-6 py-20 bg-[#121418] border border-white/5 rounded-[28px]">
            <Lightbulb size={48} className="text-gray-700" />
            <div className="text-center space-y-2">
              <p className="text-white font-bold text-lg">Sin recomendaciones</p>
              <p className="text-gray-600 text-sm">
                {tab === 'applied'
                  ? 'Aún no has aplicado ninguna recomendación.'
                  : 'Genera recomendaciones basadas en tu estado financiero actual.'}
              </p>
            </div>
            {tab !== 'applied' && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="bg-[#10B981] text-black font-bold px-6 py-3 rounded-2xl text-sm"
              >
                Generar recomendaciones
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((rec) => {
              const color = typeColor(rec.type)
              const icon = typeIcon(rec.type)
              return (
                <div
                  key={rec.id}
                  className={`bg-[#121418] border border-white/5 rounded-[28px] p-8 space-y-4 transition-all ${
                    rec.isApplied ? 'opacity-50' : ''
                  }`}
                  style={{ borderLeft: `3px solid ${color}` }}
                  onMouseEnter={() => { if (!rec.isRead) handleMarkRead(rec.id) }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <span className="text-2xl shrink-0">{icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-base font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">
                            {rec.title}
                          </h3>
                          {!rec.isRead && (
                            <span className="w-2 h-2 bg-[#10B981] rounded-full" />
                          )}
                          {rec.isApplied && (
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                              style={{ color: '#10B981', borderColor: '#10B98140', background: '#10B98115' }}
                            >
                              APLICADA
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                          {rec.description}
                        </p>
                        {rec.impact && (
                          <p className="text-xs text-gray-600 mt-2 font-['JetBrains_Mono',monospace]">
                            💡 {rec.impact}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-600 shrink-0">
                      {formatDistanceToNow(new Date(rec.createdAt), { addSuffix: true, locale: es })}
                    </span>
                  </div>

                  {/* Actions */}
                  {!rec.isApplied && (
                    <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-white/5">
                      {rec.actionPath && (
                        <button
                          onClick={() => navigate(rec.actionPath!)}
                          className="text-xs font-bold text-[#10B981] hover:underline flex items-center gap-1"
                        >
                          Ver módulo →
                        </button>
                      )}
                      <button
                        onClick={() => handleMarkApplied(rec.id)}
                        className="text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl transition-all text-gray-400 hover:text-white"
                      >
                        ✓ Marcar como aplicada
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
