'use client'

import AnimatedNumber from '@/components/AnimatedNumber'

interface TrendPill {
  value: string
  direction: 'up' | 'down' | 'neutral'
  isPositive?: boolean // true = green even if up
}

interface MetricCardProps {
  label: string
  value: string
  numericValue?: number     // if provided, animates from 0 to this value
  prefix?: string           // e.g. "₹"
  suffix?: string           // e.g. "/mo"
  animationDelay?: number   // ms stagger
  sub?: string
  trend?: TrendPill
  accent?: 'brand' | 'danger' | 'warning' | 'info'
}

const ACCENT_COLORS = {
  brand:   'var(--brand)',
  danger:  'var(--danger)',
  warning: 'var(--warning)',
  info:    'var(--info)',
}

export default function MetricCard({ label, value, numericValue, prefix = '', suffix = '', animationDelay = 0, sub, trend, accent = 'brand' }: MetricCardProps) {
  const trendColor =
    !trend ? undefined :
    trend.isPositive ? 'var(--brand)' :
    trend.direction === 'up' ? 'var(--danger)' :
    trend.direction === 'down' ? 'var(--brand)' :
    'var(--text-muted)'

  return (
    <div
      className="metric-card card-hover animate-fade-in"
    >
      <p
        className="text-xs uppercase tracking-widest font-medium mb-3"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label}
      </p>
      <p
        className="text-3xl font-medium leading-none mb-2"
        style={{ fontFamily: "'DM Mono', monospace", color: ACCENT_COLORS[accent] }}
      >
        {numericValue !== undefined ? (
          <AnimatedNumber
            value={numericValue}
            prefix={prefix}
            suffix={suffix}
            delay={animationDelay}
            formatFn={(n) => n.toLocaleString('en-IN')}
          />
        ) : (
          value
        )}
      </p>
      {(sub || trend) && (
        <div className="flex items-center gap-2 mt-1">
          {sub && (
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {sub}
            </span>
          )}
          {trend && (
            <span
              className="text-xs font-mono px-1.5 py-0.5 rounded"
              style={{
                color: trendColor,
                background: `${trendColor}22`,
              }}
            >
              {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '–'}{' '}
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
