import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /** Color del fill: 'emerald' | 'blue' | 'amber' | 'rose' */
  variant?: 'emerald' | 'blue' | 'amber' | 'rose'
  /** Agrega glow al fill */
  glow?: boolean
}

const variantStyles: Record<string, string> = {
  emerald: 'bg-[#10B981]',
  blue: 'bg-blue-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500'
}

const glowStyles: Record<string, string> = {
  emerald: 'shadow-[0_0_10px_#10B981]',
  blue: 'shadow-[0_0_10px_#60A5FA]',
  amber: 'shadow-[0_0_10px_#F59E0B]',
  rose: 'shadow-[0_0_10px_#F43F5E]'
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant = 'emerald', glow = false, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-white/5', className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        'h-full w-full flex-1 rounded-full transition-all duration-700 ease-out',
        variantStyles[variant],
        glow && glowStyles[variant]
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
