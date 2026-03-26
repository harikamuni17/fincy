'use client'

import { AlertTriangle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { ForecastAlert } from '@/types'

interface LossPreventionProps {
  alerts: ForecastAlert[]
}

const SEVERITY_COLORS = {
  CRITICAL: { bg: 'rgba(255,77,106,0.08)', border: 'rgba(255,77,106,0.3)', text: 'var(--danger)', dotColor: 'var(--danger)' },
  HIGH:     { bg: 'rgba(255,181,71,0.08)', border: 'rgba(255,181,71,0.25)', text: 'var(--warning)', dotColor: 'var(--warning)' },
  MEDIUM:   { bg: 'rgba(108,142,255,0.06)', border: 'rgba(108,142,255,0.2)', text: 'var(--info)', dotColor: 'var(--info)' },
  LOW:      { bg: 'var(--bg-elevated)', border: 'var(--border)', text: 'var(--text-secondary)', dotColor: 'var(--text-muted)' },
}

export default function LossPrevention({ alerts }: LossPreventionProps) {
  if (alerts.length === 0) {
    return (
      <div
        className="rounded-xl p-5"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={14} style={{ color: 'var(--brand)' }} />
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
            Loss Prevention
          </p>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          ✓ No active loss alerts. Spending is within expected bounds.
        </p>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={14} className="animate-pulse-brand" style={{ color: 'var(--danger)' }} />
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
          Loss Prevention Alerts
        </p>
        <span
          className="ml-auto text-xs font-mono px-2 py-0.5 rounded"
          style={{ background: 'rgba(255,77,106,0.12)', color: 'var(--danger)' }}
        >
          {alerts.length} active
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, idx) => {
          const colors = SEVERITY_COLORS[alert.severity]
          return (
            <div
              key={idx}
              className="p-3 rounded-lg"
              style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
            >
              <div className="flex items-start gap-2">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0 mt-1 animate-pulse-brand"
                  style={{ background: colors.dotColor }}
                />
                <div className="flex-1">
                  <p className="text-xs leading-relaxed mb-2" style={{ color: colors.text }}>
                    {alert.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                        ₹{alert.predictedLoss.toLocaleString('en-IN')} at risk
                      </span>
                      <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                        in {alert.daysUntil} days
                      </span>
                    </div>
                    <Link
                      href="/actions"
                      className="flex items-center gap-1 text-xs"
                      style={{ color: 'var(--brand)' }}
                    >
                      Prevent <ArrowRight size={10} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
