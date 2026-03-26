'use client'

import { useState } from 'react'

interface Step {
  label: string
  text: string
  confidence?: number
}

interface Props {
  findingId: string
}

export default function AgentReasoningPanel({ findingId }: Props) {
  const [steps, setSteps] = useState<Step[]>([])
  const [eli5, setEli5] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  async function load() {
    if (steps.length > 0) { setOpen(o => !o); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/agent-reasoning?findingId=${encodeURIComponent(findingId)}`)
      if (res.ok) {
        const data = await res.json()
        setSteps(data.steps ?? [])
        setEli5(data.eli5Summary ?? '')
      }
    } finally {
      setLoading(false)
      setOpen(true)
    }
  }

  return (
    <div style={{ marginTop: 12 }}>
      <button
        onClick={load}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid #1E2535', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: '#8B92A5', fontSize: 12, fontFamily: "'DM Mono', monospace" }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke="#8B92A5" strokeWidth="1.2" />
          <path d="M5 5.5c0-1.1.9-2 2-2s2 .9 2 2c0 .9-.5 1.4-1.2 1.8L7 6.8V8" stroke="#8B92A5" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="7" cy="10" r=".6" fill="#8B92A5" />
        </svg>
        {loading ? 'Loading reasoning…' : open ? 'Hide reasoning' : 'How did FINCI decide this?'}
      </button>

      {open && (
        <div style={{ marginTop: 12, background: '#0D0F14', border: '1px solid #1E2535', borderRadius: 12, padding: 20 }}>
          {eli5 && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.15)', borderRadius: 8 }}>
              <p style={{ fontSize: 10, color: '#00D4AA', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>Plain English (ELI5)</p>
              <p style={{ fontSize: 13, color: '#F0F2F5', lineHeight: 1.6 }}>{eli5}</p>
            </div>
          )}
          <p style={{ fontSize: 10, color: '#4A5065', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>Step-by-step reasoning</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#00D4AA' }}>{i + 1}</span>
                  </div>
                  {i < steps.length - 1 && <div style={{ width: 1, flex: 1, background: '#1E2535', margin: '0 auto', minHeight: 16 }} />}
                </div>
                <div style={{ paddingBottom: 16, flex: 1 }}>
                  <p style={{ fontSize: 11, color: '#00D4AA', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'DM Mono', monospace", marginBottom: 3 }}>{step.label}</p>
                  <p style={{ fontSize: 13, color: '#8B92A5', lineHeight: 1.5 }}>{step.text}</p>
                  {step.confidence !== undefined && (
                    <p style={{ fontSize: 10, color: '#4A5065', marginTop: 4 }}>Confidence: {Math.round(step.confidence * 100)}%</p>
                  )}
                </div>
              </div>
            ))}
            {steps.length === 0 && (
              <p style={{ fontSize: 13, color: '#4A5065' }}>No reasoning steps recorded yet. Run a new analysis to generate them.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
