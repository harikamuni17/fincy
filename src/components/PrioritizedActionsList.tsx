'use client'

import Link from 'next/link'
import type { TopAction } from '@/types'

interface PrioritizedActionsListProps {
  actions: TopAction[]
}

const IMPACT_LABELS: Record<string, string> = {
  '1': 'VERY HIGH IMPACT',
  '2': 'HIGH IMPACT',
  '3': 'HIGH IMPACT',
  '4': 'MEDIUM IMPACT',
  '5': 'MEDIUM IMPACT',
}

export default function PrioritizedActionsList({ actions }: PrioritizedActionsListProps) {
  if (actions.length === 0) {
    return (
      <div
        className="rounded-xl p-6 h-full flex flex-col items-center justify-center gap-3"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No actions yet</p>
        <Link href="/upload" className="btn-primary text-xs">
          Load Data →
        </Link>
      </div>
    )
  }

  const maxSaving = Math.max(...actions.map((a) => a.savingAnnual))
  const totalAnnual = actions.reduce((s, a) => s + a.savingAnnual, 0)

  return (
    <div
      className="rounded-xl p-5 h-full flex flex-col"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
          Top actions to save maximum money
        </p>
        <Link href="/actions" className="text-xs" style={{ color: 'var(--brand)' }}>
          View All →
        </Link>
      </div>

      <div className="flex-1 space-y-4">
        {actions.map((action) => {
          const barWidth = (action.savingAnnual / maxSaving) * 100
          return (
            <div key={action.rank}>
              <div className="flex items-start gap-3 mb-1.5">
                <span
                  className="text-lg font-mono font-bold leading-none flex-shrink-0"
                  style={{ color: 'var(--brand)' }}
                >
                  #{action.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-snug mb-0.5" style={{ color: 'var(--text-primary)' }}>
                    {action.title}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono" style={{ color: 'var(--brand)' }}>
                      ₹{action.savingMonthly.toLocaleString('en-IN')}/mo
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>·</span>
                    <span className="text-xs font-mono" style={{ color: 'var(--brand)' }}>
                      ₹{action.savingAnnual.toLocaleString('en-IN')}/yr
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>·</span>
                    <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                      {(action.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 progress-bar-track">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span
                  className="text-[10px] font-mono flex-shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {IMPACT_LABELS[String(action.rank)] ?? 'MEDIUM IMPACT'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Total */}
      <div
        className="mt-4 pt-4"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
            Total Annual Savings
          </span>
          <span
            className="text-xl font-mono font-bold"
            style={{ color: 'var(--brand)' }}
          >
            ₹{totalAnnual.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  )
}
