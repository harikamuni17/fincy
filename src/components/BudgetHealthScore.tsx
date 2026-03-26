'use client'

import { useEffect, useState } from 'react'
import AnimatedNumber from '@/components/AnimatedNumber'

interface BudgetHealthScoreProps {
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  label: string
  color: string
  previousScore?: number
}

const CIRCUMFERENCE = 2 * Math.PI * 80 // ≈ 502.65

export default function BudgetHealthScore({ score, grade, label, color, previousScore }: BudgetHealthScoreProps) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setAnimated(true), 10)
    return () => clearTimeout(id)
  }, [])

  const dashOffset = animated
    ? CIRCUMFERENCE - (CIRCUMFERENCE * score) / 100
    : CIRCUMFERENCE

  const delta = previousScore !== undefined ? score - previousScore : null

  return (
    <div
      className="metric-card"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 24,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--text-secondary)',
          marginBottom: 12,
        }}
      >
        Budget Health Score
      </p>

      <svg width="160" height="160" viewBox="0 0 200 200">
        {/* Track */}
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke="#1E2535"
          strokeWidth="12"
        />
        {/* Progress arc */}
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 100 100)"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />
        {/* Score */}
        <text
          x="100"
          y="100"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          fontSize="42"
          fontFamily="'DM Mono', monospace"
          fontWeight="500"
        >
          <AnimatedNumber value={score} duration={1200} delay={50} />
        </text>
        <text
          x="100"
          y="128"
          textAnchor="middle"
          fill="var(--text-muted)"
          fontSize="13"
          fontFamily="'DM Mono', monospace"
        >
          /100 · {grade}
        </text>
      </svg>

      <p style={{ fontSize: 13, fontWeight: 500, color, marginTop: 4 }}>{label}</p>

      {delta !== null && (
        <span
          style={{
            marginTop: 6,
            fontSize: 11,
            color: delta >= 0 ? '#00D4AA' : '#FF4D6A',
            background: delta >= 0 ? 'rgba(0,212,170,0.12)' : 'rgba(255,77,106,0.12)',
            borderRadius: 20,
            padding: '2px 8px',
          }}
        >
          {delta >= 0 ? '+' : ''}{delta} from last month
        </span>
      )}
    </div>
  )
}
