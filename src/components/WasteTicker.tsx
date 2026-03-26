'use client'

import { useWasteTicker } from '@/hooks/useWasteTicker'

interface WasteTickerProps {
  annualWaste: number
  sessionStartTime?: Date
}

export default function WasteTicker({ annualWaste }: WasteTickerProps) {
  const { formattedValue, perSecond } = useWasteTicker(annualWaste)

  const perSecondFormatted = perSecond.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 3,
  })

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        borderLeft: '2px solid var(--danger)',
        borderRadius: '0 12px 12px 0',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          {/* Pulsing red dot */}
          <span
            style={{
              display: 'inline-block',
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--danger)',
              animation: 'waste-pulse 1.5s ease-in-out infinite',
            }}
          />
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: 11,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Wasted since you opened this page
          </p>
        </div>
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 36,
            fontWeight: 500,
            color: 'var(--danger)',
            lineHeight: 1,
            transition: 'all 0.1s linear',
          }}
        >
          {formattedValue}
        </p>
        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: 12,
            marginTop: 4,
          }}
        >
          ▲ +{perSecondFormatted}/sec
        </p>
      </div>

      <div
        style={{
          textAlign: 'right',
          paddingRight: 4,
        }}
      >
        <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 2 }}>Annual waste</p>
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 18,
            color: 'var(--danger)',
            fontWeight: 500,
          }}
        >
          {annualWaste.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
        </p>
      </div>

      <style>{`
        @keyframes waste-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
