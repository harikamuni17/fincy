import { useState, useEffect, useRef } from 'react'

interface UseWasteTickerResult {
  tickerValue: number
  formattedValue: string
  perSecond: number
}

export function useWasteTicker(annualWaste: number): UseWasteTickerResult {
  const perSecond = annualWaste / 365 / 24 / 3600
  const [tickerValue, setTickerValue] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (annualWaste <= 0) return

    const increment = perSecond / 10 // update 10× per second for smooth animation

    const start = () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = setInterval(() => {
        if (document.hidden) return
        setTickerValue((prev) => prev + increment)
      }, 100)
    }

    start()

    const handleVisibility = () => {
      if (!document.hidden) {
        start()
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [annualWaste, perSecond])

  const formattedValue = tickerValue.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  })

  return { tickerValue, formattedValue, perSecond }
}
