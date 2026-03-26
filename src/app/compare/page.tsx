'use client'

import BeforeAfterSlider from '@/components/BeforeAfterSlider'
import PeerBenchmark from '@/components/PeerBenchmark'

const CATEGORIES = [
  { category: 'Cloud', yourSpend: 85000 },
  { category: 'SaaS', yourSpend: 72000 },
  { category: 'Travel', yourSpend: 38000 },
  { category: 'Marketing', yourSpend: 95000 },
]

function SpendVisualization({ label, spend, color }: { label: string; spend: number; color: string }) {
  const bars = [
    { name: 'Infrastructure', value: spend * 0.35 },
    { name: 'SaaS', value: spend * 0.25 },
    { name: 'Travel', value: spend * 0.18 },
    { name: 'Marketing', value: spend * 0.14 },
    { name: 'Other', value: spend * 0.08 },
  ]
  const max = bars[0].value
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 16 }}>
      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 24, color, marginBottom: 4 }}>₹{spend.toLocaleString('en-IN')}/mo</p>
      {bars.map((b) => (
        <div key={b.name}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: 10, color: '#8B92A5' }}>{b.name}</span>
            <span style={{ fontSize: 10, color: '#4A5065', fontFamily: "'DM Mono', monospace" }}>₹{Math.round(b.value).toLocaleString('en-IN')}</span>
          </div>
          <div style={{ height: 4, background: '#1E2535', borderRadius: 2 }}>
            <div style={{ height: '100%', width: `${(b.value / max) * 100}%`, background: color, borderRadius: 2 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ComparePage() {
  return (
    <main style={{ padding: '36px 48px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 10, color: '#4A5065', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>Visual Comparison</p>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, color: '#F0F2F5', fontWeight: 700 }}>Before vs. After FINCI</h1>
        <p style={{ fontSize: 14, color: '#8B92A5', marginTop: 6 }}>Drag the slider to compare your spend profile before and after optimization</p>
      </div>

      <BeforeAfterSlider
        leftLabel="Before FINCI"
        leftChildren={<SpendVisualization label="Before" spend={420000} color="#FF4D6A" />}
        rightLabel="After FINCI"
        rightChildren={<SpendVisualization label="After (projected)" spend={278000} color="#00D4AA" />}
      />

      <div style={{ marginTop: 16, padding: '12px 20px', background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 24, color: '#00D4AA' }}>₹1,42,000/mo</span>
        <span style={{ fontSize: 14, color: '#8B92A5' }}>saved · 33.8% reduction · drag to see breakdown</span>
      </div>

      <div style={{ marginTop: 40 }}>
        <p style={{ fontSize: 16, color: '#F0F2F5', fontWeight: 600, marginBottom: 20 }}>Peer Benchmarks by Category</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {CATEGORIES.map((c) => (
            <PeerBenchmark key={c.category} category={c.category} yourSpend={c.yourSpend} employeeCount={120} />
          ))}
        </div>
      </div>
    </main>
  )
}
