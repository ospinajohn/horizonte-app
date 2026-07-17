import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Receipt,
  CalendarClock,
  Target,
  Activity,
  Settings,
  BarChart3,
  Bell,
  Wallet,
  ArrowLeftRight,
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
  MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip'

interface NavItem {
  icon: React.ReactNode
  label: string
  path: string
}

const NAV_ITEMS_FASE1: NavItem[] = [
  { icon: <LayoutDashboard size={22} />, label: 'Dashboard', path: '/' },
  { icon: <Wallet size={22} />, label: 'Cuentas', path: '/cuentas' },
  { icon: <Receipt size={22} />, label: 'Transacciones', path: '/transacciones' },
  { icon: <ArrowLeftRight size={22} />, label: 'Transferencias', path: '/transferencias' },
  { icon: <CalendarClock size={22} />, label: 'Planificador', path: '/planificador' },
  { icon: <Target size={22} />, label: 'Metas', path: '/metas' },
  { icon: <BarChart3 size={22} />, label: 'Presupuestos', path: '/presupuestos' },
  { icon: <Activity size={22} />, label: 'Analítica', path: '/analitica' }
]

const NAV_ITEMS_FASE2: NavItem[] = [
  { icon: <Landmark size={22} />, label: 'Créditos', path: '/creditos' },
  { icon: <CreditCard size={22} />, label: 'Tarjetas', path: '/tarjetas' },
  { icon: <TrendingUp size={22} />, label: 'Patrimonio', path: '/patrimonio' },
  { icon: <TestTube2 size={22} />, label: 'Simulador', path: '/simulador' },
  { icon: <Scale size={22} />, label: 'Endeudamiento', path: '/endeudamiento' },
  { icon: <Shield size={22} />, label: 'Fondo Emerg.', path: '/fondo-emergencia' },
  { icon: <Repeat size={22} />, label: 'Suscripciones', path: '/suscripciones' },
  { icon: <FileText size={22} />, label: 'Reportes', path: '/reportes' }
]

const NAV_ITEMS_FASE3: NavItem[] = [
  { icon: <HeartPulse size={22} />, label: 'Salud Financiera', path: '/salud' },
  { icon: <Lightbulb size={22} />, label: 'Recomendaciones', path: '/recomendaciones' },
  { icon: <MessageSquare size={22} />, label: 'Centro Decisiones', path: '/decisiones' }
]

interface SidebarProps {
  unreadAlerts?: number
  onNavigate?: (path: string) => void
}

export function Sidebar({ unreadAlerts = 0, onNavigate }: SidebarProps): JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()

  const handleNav = (path: string): void => {
    navigate(path)
    onNavigate?.(path)
  }

  const renderNavItem = (item: NavItem): JSX.Element => {
    const isActive = location.pathname === item.path
    return (
      <Tooltip key={item.path} content={item.label} side="right">
        <button
          onClick={() => handleNav(item.path)}
          className={cn(
            'w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-200',
            isActive
              ? 'text-[#10B981] bg-[#10B981]/8'
              : 'text-gray-600 hover:text-white hover:bg-white/5'
          )}
          aria-label={item.label}
        >
          {item.icon}
        </button>
      </Tooltip>
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      <aside className="w-24 bg-[#0A0B0D] border-r border-white/5 flex flex-col items-center py-10 z-50 shrink-0 overflow-y-auto custom-scrollbar">

        {/* Logo */}
        <div
          className="w-12 h-12 bg-[#10B981] rounded-2xl flex items-center justify-center mb-10 cursor-pointer shrink-0"
          style={{ boxShadow: '0 0 25px rgba(16,185,129,0.4)' }}
          onClick={() => handleNav('/')}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 17l5-5 4 4 9-10"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Fase 1 nav */}
        <nav className="flex flex-col gap-2">
          {NAV_ITEMS_FASE1.map(renderNavItem)}
        </nav>

        {/* Separator */}
        <div className="w-8 h-px bg-white/5 my-3 shrink-0" />

        {/* Fase 2 nav */}
        <nav className="flex flex-col gap-2">
          {NAV_ITEMS_FASE2.map(renderNavItem)}
        </nav>

        {/* Separator Fase 3 */}
        <div className="w-8 h-px bg-white/5 my-3 shrink-0" />

        {/* Fase 3 nav */}
        <nav className="flex flex-col gap-2">
          {NAV_ITEMS_FASE3.map(renderNavItem)}
        </nav>

        {/* Bottom controls */}
        <div className="mt-auto flex flex-col gap-6 items-center pt-4 shrink-0">
          {/* Alertas */}
          <Tooltip content="Alertas" side="right">
            <button
              onClick={() => handleNav('/alertas')}
              className="relative w-10 h-10 flex items-center justify-center text-gray-600 hover:text-white transition-all"
              aria-label="Alertas"
            >
              <Bell size={20} />
              {unreadAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] font-bold flex items-center justify-center text-white">
                  {unreadAlerts > 9 ? '9+' : unreadAlerts}
                </span>
              )}
            </button>
          </Tooltip>

          {/* Settings */}
          <Tooltip content="Configuración" side="right">
            <button
              onClick={() => handleNav('/configuracion')}
              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-white transition-all"
              aria-label="Configuración"
            >
              <Settings size={20} />
            </button>
          </Tooltip>

          {/* Avatar */}
          <div className="w-10 h-10 rounded-full border-2 border-white/10 p-0.5">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-[#10B981]/40 to-[#10B981]/10 flex items-center justify-center">
              <span className="text-xs font-bold text-[#10B981]">U</span>
            </div>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}
