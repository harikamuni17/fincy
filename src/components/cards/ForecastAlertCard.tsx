'use client'

import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import type { ForecastRecord } from '@/types'

interface ForecastAlertCardProps {
  forecast: ForecastRecord | null
  nextMonthWaste?: number
}

export default function ForecastAlertCard({ forecast, nextMonthWaste = 0 }: ForecastAlertCardProps) {
  if (!forecast && nextMonthWaste === 0) {
    return (
      <div
        className="rounded-xl p-5 h-full flex items-center justify-center"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No forecast data</p>
      </div>
    )
  }

  const waste = nextMonthWaste || ((forecast as unknown as { predictedWaste: number })?.predictedWaste ?? 0)
  const isAlert = (forecast as unknown as { isAlert: boolean })?.isAlert ?? waste > 80000
  const daysBar = Math.min(100, ((30 - 7) / 30) * 100) // demo: 23 days elapsed

  return (
    <div
      className="rounded-xl p-5 h-full animate-fade-in"
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${isAlert ? 'rgba(255,77,106,0.25)' : 'var(--border)'}`,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle
          size={14}
          className={isAlert ? 'animate-pulse-brand' : ''}
          style={{ color: isAlert ? 'var(--danger)' : 'var(--warning)' }}
        />
        <span className="text-xs uppercase tracking-widest font-medium" style={{ color: 'var(--text-muted)' }}>
          30-Day Forecast
        </span>
      </div>

      <p
        className="text-2xl font-mono font-medium mb-1"
        style={{ color: isAlert ? 'var(--danger)' : 'var(--warning)' }}
      >
        ₹{waste.toLocaleString('en-IN')}
      </p>
      <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
        projected waste next 30 days
      </p>

      {/* Days remaining bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
          <span>Month start</span>
          <span>23 days elapsed</span>
        </div>
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{
              width: `${daysBar}%`,
              background: isAlert ? 'var(--danger)' : 'var(--warning)',
            }}
          />
        </div>
      </div>

      <Link
        href="/forecast"
        className="text-xs font-medium transition-colors"
        style={{ color: 'var(--brand)' }}
      >
        View full forecast →
      </Link>
    </div>
  )
}
