'use client'

import { useAnimatedNumber } from '@/hooks/useAnimatedNumber'

interface AnimatedNumberProps {
  value: number
  prefix?: string
  suffix?: string
  duration?: number
  delay?: number
  formatFn?: (n: number) => string
  className?: string
}

function defaultFormat(n: number): string {
  return n.toLocaleString('en-IN')
}

export default function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  duration = 800,
  delay = 0,
  formatFn = defaultFormat,
  className,
}: AnimatedNumberProps) {
  const displayValue = useAnimatedNumber(value, duration, delay)

  return (
    <span className={className}>
      {prefix}
      {formatFn(displayValue)}
      {suffix}
    </span>
  )
}
