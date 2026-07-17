interface PageHeaderProps {
  subtitle: string
  title: string
  actions?: React.ReactNode
}

export function PageHeader({ subtitle, title, actions }: PageHeaderProps): JSX.Element {
  return (
    <div className="flex items-end justify-between">
      <div>
        <p className="text-[10px] font-bold text-[#10B981] uppercase tracking-[0.4em]">
          {subtitle}
        </p>
        <h1 className="text-4xl font-['Plus_Jakarta_Sans',sans-serif] font-extrabold tracking-tight text-white mt-1">
          {title}
        </h1>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  )
}
