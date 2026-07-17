import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Icono a mostrar a la izquierda del input */
  leftIcon?: React.ReactNode
  /** Icono a mostrar a la derecha del input */
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <span className="absolute left-3.5 text-gray-600 pointer-events-none flex items-center">
            {leftIcon}
          </span>
        )}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-2xl border border-white/5 bg-white/5',
            'px-4 py-2 text-sm text-white placeholder:text-gray-600',
            'transition-colors',
            'focus:outline-none focus:border-[#10B981]/50 focus:bg-white/[0.07]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className
          )}
          ref={ref}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3.5 text-gray-600 pointer-events-none flex items-center">
            {rightIcon}
          </span>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
