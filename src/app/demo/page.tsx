'use client'

import { useEffect, useState } from 'react'
import DemoMode from '@/components/DemoMode'

export default function DemoPage() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Allow a tick so hydration is safe
    setShow(true)
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') window.history.back()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!show) return null

  return (
    <DemoMode
      annualWaste={960000}
      totalSpend={4200000}
      overspendPct={28}
      topWasteCategory="Cloud Infrastructure"
      nextMonthWaste={83000}
      score={62}
      grade="C"
      scoreColor="#FFB547"
    />
  )
}
