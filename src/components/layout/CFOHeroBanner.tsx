'use client'

import type { CFOSummary } from '@/types'

interface CFOHeroBannerProps {
  summary: CFOSummary | null
  loading?: boolean
}

export default function CFOHeroBanner({ summary, loading }: CFOHeroBannerProps) {
  if (loading) {
    return (
      <div
        className="w-full px-8 py-6 animate-pulse"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="skeleton h-7 w-2/3 mb-3" />
        <div className="skeleton h-5 w-1/2" />
      </div>
    )
  }

  if (!summary) {
    return (
      <div
        className="w-full px-8 py-6"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Load demo data or upload financial data to see your CFO summary.
        </p>
      </div>
    )
  }

  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN')

  return (
    <div
      className="w-full px-8 py-6"
      style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-base)' }}
    >
      <div className="flex items-start justify-between gap-8">
        {/* Left: headline */}
        <div className="flex-1">
          <p
            className="font-display text-xl font-semibold leading-snug mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            Your company is overspending{' '}
            <span style={{ fontFamily: "'DM Mono', monospace", color: 'var(--danger)' }}>
              {summary.overspendPercent.toFixed(0)}%
            </span>{' '}
            due to{' '}
            <span style={{ color: 'var(--text-secondary)' }}>{summary.topWasteCategory}</span>.
          </p>
          <p className="text-base font-display font-medium" style={{ color: 'var(--text-secondary)' }}>
            Applying top {summary.topThreeActions.length} optimizations saves{' '}
            <span
              className="font-['DM_Mono'] text-lg"
              style={{ color: 'var(--brand)' }}
            >
              {fmt(summary.annualSavingsIfActed)}
            </span>{' '}
            annually.
          </p>

          {/* Forecast alert */}
          {summary.forecastAlerts.length > 0 && (
            <div
              className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg inline-flex"
              style={{
                background: 'rgba(255,77,106,0.08)',
                border: '1px solid rgba(255,77,106,0.2)',
              }}
            >
              <span className="animate-pulse-brand text-sm">⚠️</span>
              <p className="text-xs" style={{ color: 'var(--danger)' }}>
                {summary.forecastAlerts[0]}
              </p>
            </div>
          )}
        </div>

        {/* Right: top 3 action pills */}
        {summary.topThreeActions.length > 0 && (
          <div className="flex-shrink-0 space-y-2 min-w-[280px]">
            {summary.topThreeActions.map((action) => (
              <div
                key={action.rank}
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                }}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold flex-shrink-0"
                  style={{ background: 'var(--brand-dim)', color: 'var(--brand)' }}
                >
                  {action.rank}
                </span>
                <span
                  className="text-xs flex-1 truncate"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {action.title.substring(0, 48)}…
                </span>
                <span
                  className="text-xs font-mono flex-shrink-0"
                  style={{ color: 'var(--brand)' }}
                >
                  save {fmt(action.savingMonthly)}/mo
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
