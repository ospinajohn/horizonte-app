import { Terminal } from 'lucide-react'

type LogLevel = 'SAFE' | 'WARN' | 'INFO' | 'ERR'

interface LogEntry {
  level: LogLevel
  message: string
}

interface DecisionLogProps {
  entries?: LogEntry[]
}

const levelColors: Record<LogLevel, string> = {
  SAFE: 'text-[#10B981]',
  WARN: 'text-amber-500',
  INFO: 'text-blue-400',
  ERR: 'text-rose-500'
}

export function DecisionLog({ entries = [] }: DecisionLogProps): JSX.Element {
  return (
    <div className="bg-black/40 border border-emerald-500/20 rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.2)] p-8 flex-1">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Terminal size={14} className="text-[#10B981]" />
        <span className="text-[10px] font-['JetBrains_Mono',monospace] font-bold text-gray-500 uppercase tracking-widest">
          Decision_Log_v1
        </span>
        {/* Dot pulse */}
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
      </div>

      {/* Log entries */}
      <div className="space-y-4 font-['JetBrains_Mono',monospace] text-[10px] text-gray-400">
        {entries.map((entry, i) => (
          <p key={i} className="leading-relaxed">
            <span className={levelColors[entry.level]}>
              [{entry.level}]
            </span>
            {' '}
            {entry.message}
          </p>
        ))}
      </div>
    </div>
  )
}
