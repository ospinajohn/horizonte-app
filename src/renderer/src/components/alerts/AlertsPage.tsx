import { useState, useEffect, useCallback } from 'react'
import { Bell, AlertTriangle, AlertCircle, Info, CheckCheck, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { Alert, AlertSeverity } from '../../../../shared/types'

type Tab = 'all' | 'unread' | 'critical'

const SEVERITY_ICON: Record<AlertSeverity, JSX.Element> = {
  CRITICAL: <AlertTriangle size={18} className="text-rose-400" />,
  WARNING: <AlertCircle size={18} className="text-amber-400" />,
  INFO: <Info size={18} className="text-blue-400" />
}

const SEVERITY_BG: Record<AlertSeverity, string> = {
  CRITICAL: 'bg-rose-500/10',
  WARNING: 'bg-amber-500/10',
  INFO: 'bg-blue-500/10'
}

function AlertItem({
  alert,
  onMarkRead,
  onDismiss
}: {
  alert: Alert
  onMarkRead: (id: number) => void
  onDismiss: (id: number) => void
}): JSX.Element {
  const date = new Date(alert.createdAt)

  return (
    <div
      className={cn(
        'flex items-start gap-4 p-5 rounded-2xl transition-all group relative',
        'hover:bg-white/5',
        !alert.isRead && 'bg-white/[0.02]'
      )}
    >
      {/* Indicador no leído */}
      {!alert.isRead && (
        <span className="absolute top-5 right-5 w-2 h-2 rounded-full bg-[#10B981] shrink-0" />
      )}

      {/* Icono severidad */}
      <div className={cn(
        'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0',
        SEVERITY_BG[alert.severity]
      )}>
        {SEVERITY_ICON[alert.severity]}
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0 pr-16">
        <p className="text-sm font-semibold text-white mb-0.5">{alert.title}</p>
        <p className="text-[13px] text-gray-400 leading-relaxed">{alert.message}</p>
        <p className="text-[11px] text-gray-600 mt-2">
          {formatDistanceToNow(date, { locale: es, addSuffix: true })}
        </p>
      </div>

      {/* Acciones — aparecen en hover */}
      <div className="absolute right-5 top-1/2 -translate-y-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
        {!alert.isRead && (
          <button
            onClick={() => onMarkRead(alert.id)}
            title="Marcar como leída"
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-[#10B981]/20 text-gray-500 hover:text-[#10B981] transition-all"
          >
            <CheckCheck size={14} />
          </button>
        )}
        <button
          onClick={() => onDismiss(alert.id)}
          title="Descartar"
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 transition-all"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

export function AlertsPage(): JSX.Element {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [markingAll, setMarkingAll] = useState(false)

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    try {
      const result = await window.api.alerts.getAll()
      if (result.success && result.data) {
        setAlerts(
          result.data.map((a: Alert) => ({
            ...a,
            createdAt: new Date(a.createdAt)
          }))
        )
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAlerts() }, [fetchAlerts])

  const handleMarkRead = async (id: number): Promise<void> => {
    await window.api.alerts.markAsRead(id)
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, isRead: true } : a))
  }

  const handleDismiss = async (id: number): Promise<void> => {
    await window.api.alerts.dismiss(id)
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  const handleMarkAllRead = async (): Promise<void> => {
    setMarkingAll(true)
    await window.api.alerts.markAllAsRead()
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })))
    setMarkingAll(false)
  }

  const unreadCount = alerts.filter((a) => !a.isRead).length

  const filteredAlerts = alerts.filter((a) => {
    if (activeTab === 'unread') return !a.isRead
    if (activeTab === 'critical') return a.severity === 'CRITICAL'
    return true
  })

  const TAB_LABELS: { key: Tab; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'unread', label: `No leídas${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
    { key: 'critical', label: 'Críticas' }
  ]

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-12 py-8 shrink-0 flex items-end justify-between border-b border-white/5 bg-[#08090B]/80 backdrop-blur-md sticky top-0 z-10">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#10B981] mb-2">
            // Sistema
          </p>
          <h1 className="text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-white tracking-tight flex items-center gap-4">
            Alertas
            {unreadCount > 0 && (
              <span className="text-base px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold">
                {unreadCount} no leídas
              </span>
            )}
          </h1>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-2 h-10 px-5 rounded-2xl bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <CheckCheck size={16} />
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="px-12 py-4 shrink-0 flex gap-2 border-b border-white/5">
        {TAB_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'h-9 px-4 rounded-2xl text-sm font-medium transition-all',
              activeTab === key
                ? 'bg-white/10 text-white'
                : 'text-gray-500 hover:text-white hover:bg-white/5'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-12 py-6 custom-scrollbar">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-2xl animate-pulse">
                <div className="w-10 h-10 rounded-2xl bg-white/5 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-white/5 rounded" />
                  <div className="h-3 w-72 bg-white/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredAlerts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-[#10B981]/10 rounded-full flex items-center justify-center mb-6 border border-[#10B981]/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
              <Bell size={32} className="text-[#10B981]" />
            </div>
            <h2 className="text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white mb-2">
              Todo al día
            </h2>
            <p className="text-sm text-gray-500 max-w-md">
              {activeTab === 'unread'
                ? 'No tienes alertas sin leer.'
                : activeTab === 'critical'
                ? 'No hay alertas críticas activas.'
                : 'No tienes alertas activas. El sistema te notificará cuando detecte algo importante.'}
            </p>
          </div>
        )}

        {!loading && filteredAlerts.length > 0 && (
          <div className="bg-[#121418] border border-white/5 rounded-[28px] overflow-hidden divide-y divide-white/[0.03] p-2">
            {filteredAlerts.map((alert) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onMarkRead={handleMarkRead}
                onDismiss={handleDismiss}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
