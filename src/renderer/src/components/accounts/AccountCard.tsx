import { Building2, Banknote, Smartphone, CreditCard, PiggyBank, TrendingUp, Pencil, Trash2 } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import type { Account, AccountType } from '../../../../shared/types'

interface AccountCardProps {
  account: Account
  onEdit: (account: Account) => void
  onDelete: (account: Account) => void
}

function AccountIcon({ type, color }: { type: AccountType; color: string }): JSX.Element {
  const iconProps = { size: 22, color: 'white' }
  const iconMap: Record<AccountType, JSX.Element> = {
    BANCO: <Building2 {...iconProps} />,
    EFECTIVO: <Banknote {...iconProps} />,
    NEQUI: <Smartphone {...iconProps} />,
    DAVIPLATA: <Smartphone {...iconProps} />,
    TARJETA: <CreditCard {...iconProps} />,
    AHORROS: <PiggyBank {...iconProps} />,
    INVERSION: <TrendingUp {...iconProps} />
  }

  return (
    <div
      className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
      style={{ backgroundColor: color + '33', border: `1px solid ${color}40` }}
    >
      <div style={{ color }}>{iconMap[type]}</div>
    </div>
  )
}

const TYPE_LABELS: Record<AccountType, string> = {
  BANCO: 'Banco',
  EFECTIVO: 'Efectivo',
  NEQUI: 'Nequi',
  DAVIPLATA: 'Daviplata',
  TARJETA: 'Tarjeta',
  AHORROS: 'Ahorros',
  INVERSION: 'Inversión'
}

export function AccountCard({ account, onEdit, onDelete }: AccountCardProps): JSX.Element {
  const balance = account.currentBalance ?? account.initialBalance
  const isNegative = balance < 0

  return (
    <div
      className="group relative bg-[#121418] border border-white/5 rounded-[28px] p-6 transition-all duration-200 hover:border-white/10 overflow-hidden"
      style={{ borderLeft: `4px solid ${account.color}` }}
    >
      {/* Action buttons — show on hover */}
      <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={() => onEdit(account)}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white transition-all"
          aria-label="Editar cuenta"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onDelete(account)}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 transition-all"
          aria-label="Eliminar cuenta"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Icon + info */}
      <div className="flex items-start gap-4 mb-5">
        <AccountIcon type={account.type} color={account.color} />
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-0.5">
            {TYPE_LABELS[account.type]}
          </p>
          <h3 className="text-base font-semibold text-white truncate">{account.name}</h3>
          {account.isEmergencyFund && (
            <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
              Fondo emergencia
            </span>
          )}
        </div>
      </div>

      {/* Balance */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">Saldo actual</p>
        <p
          className={cn(
            "text-2xl font-['Plus_Jakarta_Sans',sans-serif] font-bold",
            isNegative ? 'text-rose-400' : 'text-white'
          )}
        >
          {formatCurrency(balance)}
        </p>
      </div>
    </div>
  )
}
