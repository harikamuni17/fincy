import { useState, useEffect, useRef } from 'react'

export function useAnimatedNumber(
  targetValue: number,
  duration: number = 800,
  delay: number = 0,
): number {
  const [displayValue, setDisplayValue] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
    }

    const startAnimation = () => {
      startTimeRef.current = null

      const animate = (timestamp: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = timestamp
        }

        const elapsed = timestamp - startTimeRef.current
        const progress = Math.min(elapsed / duration, 1)
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3)
        const current = Math.round(targetValue * eased)

        setDisplayValue(current)

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate)
        } else {
          setDisplayValue(targetValue)
        }
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    const timeoutId = delay > 0 ? setTimeout(startAnimation, delay) : null
    if (delay === 0) startAnimation()

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      if (timeoutId !== null) clearTimeout(timeoutId)
    }
  }, [targetValue, duration, delay])

  return displayValue
}
