'use client'

import { calculateDecayedConfidence, type FreshnessLevel } from '@/lib/confidenceDecay'

interface Props {
  finding: {
    confidenceScore: number
    createdAt: Date | string
  }
}

const COLOURS: Record<FreshnessLevel, string> = {
  fresh: '#00D4AA',
  aging: '#FFB547',
  stale: '#FF8C42',
  expired: '#FF4D6A',
}

const LABELS: Record<FreshnessLevel, string> = {
  fresh: 'Fresh',
  aging: 'Aging',
  stale: 'Stale',
  expired: 'Expired',
}

const ICONS: Record<FreshnessLevel, string> = {
  fresh: '●',
  aging: '◑',
  stale: '◔',
  expired: '○',
}

export default function ConfidenceDecayBadge({ finding }: Props) {
  const created = typeof finding.createdAt === 'string' ? new Date(finding.createdAt) : finding.createdAt

  const { currentConfidence, ageInDays, freshness } = calculateDecayedConfidence({
    originalConfidence: finding.confidenceScore,
    createdAt: created,
  })

  const color = COLOURS[freshness]
  const label = LABELS[freshness]
  const icon = ICONS[freshness]

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', background: `${color}15`, border: `1px solid ${color}40`, borderRadius: 20 }}>
      <span style={{ fontSize: 10, color }}>{icon}</span>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color, letterSpacing: '0.04em' }}>
        {label} · {Math.round(currentConfidence * 100)}%
      </span>
      {ageInDays > 0 && (
        <span style={{ fontSize: 10, color: `${color}80` }}>({ageInDays}d)</span>
      )}
    </div>
  )
}
