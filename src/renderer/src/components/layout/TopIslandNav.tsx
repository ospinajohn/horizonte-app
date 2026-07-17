import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  Activity,
  Bell,
  Search,
  Menu,
  ArrowLeftRight,
  CalendarClock,
  Target,
  BarChart3,
  Landmark,
  CreditCard,
  TrendingUp,
  TestTube2,
  Scale,
  Shield,
  Repeat,
  FileText,
  HeartPulse,
  Lightbulb,
  MessageSquare,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TopIslandNavProps {
  unreadAlerts?: number
}

const MORE_LINKS = [
  { label: 'Transferencias', path: '/transferencias', icon: <ArrowLeftRight size={14} /> },
  { label: 'Planificador', path: '/planificador', icon: <CalendarClock size={14} /> },
  { label: 'Metas', path: '/metas', icon: <Target size={14} /> },
  { label: 'Presupuestos', path: '/presupuestos', icon: <BarChart3 size={14} /> },
  { label: 'Créditos', path: '/creditos', icon: <Landmark size={14} /> },
  { label: 'Tarjetas', path: '/tarjetas', icon: <CreditCard size={14} /> },
  { label: 'Patrimonio', path: '/patrimonio', icon: <TrendingUp size={14} /> },
  { label: 'Simulador', path: '/simulador', icon: <TestTube2 size={14} /> },
  { label: 'Endeudamiento', path: '/endeudamiento', icon: <Scale size={14} /> },
  { label: 'Fondo Emergencia', path: '/fondo-emergencia', icon: <Shield size={14} /> },
  { label: 'Suscripciones', path: '/suscripciones', icon: <Repeat size={14} /> },
  { label: 'Reportes', path: '/reportes', icon: <FileText size={14} /> },
  { label: 'Salud Financiera', path: '/salud', icon: <HeartPulse size={14} /> },
  { label: 'Recomendaciones', path: '/recomendaciones', icon: <Lightbulb size={14} /> },
  { label: 'Decisiones', path: '/decisiones', icon: <MessageSquare size={14} /> },
  { label: 'Configuración', path: '/configuracion', icon: <Settings size={14} /> }
]

export function TopIslandNav({ unreadAlerts = 0 }: TopIslandNavProps): JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMenuNavigate = (path: string) => {
    navigate(path)
    setIsMenuOpen(false)
  }

  const MAIN_LINKS = [
    { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={16} /> },
    { label: 'Cuentas', path: '/cuentas', icon: <Wallet size={16} /> },
    { label: 'Transacciones', path: '/transacciones', icon: <Receipt size={16} /> },
    { label: 'Analítica', path: '/analitica', icon: <Activity size={16} /> }
  ]

  return (
    <div className="absolute top-[42px] left-1/2 -translate-x-1/2 z-50 flex flex-col items-center" ref={menuRef}>
      <nav className="bg-black/60 backdrop-blur-xl border border-white/10 p-2 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center gap-2">
        
        {/* Logo */}
        <div 
          onClick={() => navigate('/')}
          className="flex items-center gap-3 px-4 cursor-pointer group"
        >
          <div className="w-8 h-8 bg-[#10B981] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)] group-hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] transition-all">
            <span className="text-black font-extrabold text-sm font-['Plus_Jakarta_Sans',sans-serif]">H</span>
          </div>
          <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold tracking-widest text-white text-sm hidden lg:block">
            HORIZONTE
          </span>
        </div>

        <div className="w-px h-6 bg-white/10 mx-2" />

        {/* Links principales */}
        <div className="flex items-center gap-1">
          {MAIN_LINKS.map((link) => {
            const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path))
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300',
                  isActive 
                    ? 'bg-[#10B981] text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                {link.icon}
                {link.label}
              </button>
            )
          })}
        </div>

        <div className="w-px h-6 bg-white/10 mx-2" />

        {/* Command Search Bar */}
        <button className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm text-gray-400 group">
          <Search size={16} className="group-hover:text-white transition-colors" />
          <span className="hidden md:inline">Comando</span>
          <kbd className="font-['JetBrains_Mono',monospace] text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300 md:ml-4">
            ⌘K
          </kbd>
        </button>

        {/* Tools / More */}
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-full transition-colors ml-1",
              isMenuOpen ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
            )}
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Notificaciones */}
        <button 
          onClick={() => navigate('/alertas')}
          className="relative w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Bell size={18} />
          {unreadAlerts > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
          )}
        </button>

        {/* Avatar */}
        <div 
          onClick={() => navigate('/configuracion')}
          className="ml-2 w-9 h-9 rounded-full border border-white/20 p-0.5 cursor-pointer hover:border-[#10B981] transition-colors"
        >
          <div className="w-full h-full rounded-full bg-gradient-to-br from-[#10B981]/40 to-[#10B981]/10 flex items-center justify-center">
            <span className="text-xs font-bold text-[#10B981]">U</span>
          </div>
        </div>
      </nav>

      {/* Menu Desplegable */}
      {isMenuOpen && (
        <div className="absolute top-full mt-4 right-0 w-[420px] bg-[#0F1115]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-6 grid grid-cols-2 gap-x-8 gap-y-2 origin-top animate-fade-in">
          {MORE_LINKS.map(link => {
            const isActive = location.pathname === link.path
            return (
              <button
                key={link.path}
                onClick={() => handleMenuNavigate(link.path)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left",
                  isActive ? "text-[#10B981] bg-[#10B981]/10" : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <div className={cn("flex items-center justify-center w-6 h-6 rounded-lg", isActive ? "text-[#10B981]" : "text-gray-500")}>
                  {link.icon}
                </div>
                {link.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
