import { useEffect, useRef, useState } from 'react'

interface UseCountUpOptions {
  end: number
  duration?: number
  delay?: number
  decimals?: number
  enabled?: boolean
}

/**
 * Anima un número desde 0 hasta `end` con easing out cúbico.
 */
export function useCountUp({
  end,
  duration = 2000,
  delay = 0,
  decimals = 0,
  enabled = true
}: UseCountUpOptions): number {
  const [value, setValue] = useState(0)
  const frameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled) return

    let timeoutId: ReturnType<typeof setTimeout>

    timeoutId = setTimeout(() => {
      const animate = (timestamp: number): void => {
        if (startTimeRef.current === null) {
          startTimeRef.current = timestamp
        }
        const elapsed = timestamp - startTimeRef.current
        const progress = Math.min(elapsed / duration, 1)
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3)
        const current = eased * end

        setValue(parseFloat(current.toFixed(decimals)))

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(animate)
        } else {
          setValue(end)
        }
      }

      frameRef.current = requestAnimationFrame(animate)
    }, delay)

    return () => {
      clearTimeout(timeoutId)
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
      startTimeRef.current = null
      setValue(0)
    }
  }, [end, duration, delay, decimals, enabled])

  return value
}
