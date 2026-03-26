'use client'

import { getBenchmark, BENCHMARKS } from '@/lib/benchmarks'

interface Props {
  category: string
  yourSpend: number
  employeeCount?: number
}

export default function PeerBenchmark({ category, yourSpend, employeeCount = 100 }: Props) {
  const result = getBenchmark(category, employeeCount, yourSpend)

  const catData = BENCHMARKS.byCategory[category] ?? { small: 0, medium: 0, large: 0 }
  const maxVal = Math.max(catData.small, catData.medium, catData.large, yourSpend) * 1.2

  const bars = [
    { label: 'Small (<50)', value: catData.small, color: '#4A5065', active: result.tier === 'small' },
    { label: 'Mid (50-200)', value: catData.medium, color: '#4A5065', active: result.tier === 'medium' },
    { label: 'Large (200+)', value: catData.large, color: '#4A5065', active: result.tier === 'large' },
    { label: 'Your Company', value: yourSpend, color: result.percentAbove > 30 ? '#FF4D6A' : '#00D4AA', active: true },
  ]

  return (
    <div style={{ background: '#0D0F14', border: '1px solid #1E2535', borderRadius: 14, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 10, color: '#4A5065', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>Peer Benchmark</p>
          <p style={{ fontSize: 14, color: '#F0F2F5', fontWeight: 600 }}>{category}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: result.percentAbove > 30 ? '#FF4D6A' : '#00D4AA' }}>
            {result.percentAbove > 0 ? `+${result.percentAbove}%` : `${result.percentAbove}%`} vs. {result.tier}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {bars.map((b, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 11, color: b.active ? '#F0F2F5' : '#4A5065', fontFamily: "'DM Mono', monospace" }}>{b.label}</span>
              <span style={{ fontSize: 11, color: b.active ? b.color : '#4A5065', fontFamily: "'DM Mono', monospace" }}>
                ₹{b.value.toLocaleString('en-IN')}
              </span>
            </div>
            <div style={{ height: 6, background: '#1E2535', borderRadius: 3 }}>
              <div style={{ height: '100%', width: `${(b.value / maxVal) * 100}%`, background: b.color, borderRadius: 3, transition: 'width 0.6s ease-out', opacity: b.active ? 1 : 0.4 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Median marker */}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #1E2535' }}>
        <p style={{ fontSize: 12, color: '#8B92A5', lineHeight: 1.5 }}>{result.verdict}</p>
        <p style={{ fontSize: 10, color: '#4A5065', marginTop: 4 }}>{BENCHMARKS.sourceLabel}</p>
      </div>
    </div>
  )
}
