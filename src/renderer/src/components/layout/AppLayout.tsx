import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { TitleBar } from './TitleBar'
import { TopIslandNav } from './TopIslandNav'
import { UpdateNotification } from './UpdateNotification'

export function AppLayout(): JSX.Element {
  const [unreadAlerts, setUnreadAlerts] = useState(0)

  const loadUnreadCount = async (): Promise<void> => {
    try {
      const result = await window.api.alerts.getUnreadCount()
      if (result.success && result.data != null) {
        setUnreadAlerts(result.data)
      }
    } catch {
      // silent
    }
  }

  useEffect(() => {
    loadUnreadCount()
    // Refrescar cada 5 minutos
    const interval = setInterval(loadUnreadCount, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-[#08090B] text-white overflow-hidden select-none relative">
      {/* Barra de título custom (sin chrome nativa de Windows) */}
      <TitleBar />

      {/* Top Island Navigation */}
      <TopIslandNav unreadAlerts={unreadAlerts} />

      <div className="flex flex-1 overflow-hidden">
        {/* Área de contenido principal con grid overlay */}
        <main
          className="flex-1 overflow-y-auto pt-28" /* pt-28 para dejar espacio al Island Nav flotante */
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        >
          <Outlet />
        </main>
      </div>

      <UpdateNotification />
    </div>
  )
}
