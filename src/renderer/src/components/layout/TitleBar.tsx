import { useEffect, useState } from 'react'
import { Minus, Square, X, Maximize2 } from 'lucide-react'

export function TitleBar(): JSX.Element {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    // Obtener estado inicial
    window.api.window.isMaximized().then(setIsMaximized)

    // Escuchar cambios de maximizar/restaurar
    window.api.window.onMaximized((value) => {
      setIsMaximized(value)
    })
  }, [])

  return (
    <div
      className="flex items-center justify-between h-9 bg-[hsl(var(--titlebar))] border-b border-border drag-region flex-shrink-0 px-3"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Logo y nombre */}
      <div className="flex items-center gap-2 no-drag" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <div className="w-4 h-4 rounded bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-[9px]">H</span>
        </div>
        <span className="text-xs font-semibold text-muted-foreground tracking-wide">HORIZONTE</span>
      </div>

      {/* Espacio central draggable */}
      <div className="flex-1" />

      {/* Controles de ventana */}
      <div
        className="flex items-center no-drag"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={() => window.api.window.minimize()}
          className="w-8 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors rounded"
          title="Minimizar"
        >
          <Minus size={12} />
        </button>
        <button
          onClick={() => window.api.window.maximize()}
          className="w-8 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors rounded"
          title={isMaximized ? 'Restaurar' : 'Maximizar'}
        >
          {isMaximized ? <Square size={11} /> : <Maximize2 size={11} />}
        </button>
        <button
          onClick={() => window.api.window.close()}
          className="w-8 h-7 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-destructive transition-colors rounded"
          title="Cerrar"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  )
}
