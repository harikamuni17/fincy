'use client'

import { useState } from 'react'

interface Props {
  content: React.ReactNode
  findingId?: string
  eli5Text?: string
}

export default function ELI5Toggle({ content, findingId, eli5Text }: Props) {
  const [isELI5, setIsELI5] = useState(false)
  const [eli5, setEli5] = useState(eli5Text ?? '')
  const [loading, setLoading] = useState(false)

  async function toggleELI5() {
    if (isELI5) { setIsELI5(false); return }
    if (!eli5 && findingId) {
      setLoading(true)
      try {
        const res = await fetch('/api/eli5', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ findingId }),
        })
        if (res.ok) {
          const data = await res.json()
          setEli5(data.summary ?? '')
        }
      } finally {
        setLoading(false)
      }
    }
    setIsELI5(true)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button
          onClick={toggleELI5}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: isELI5 ? 'rgba(0,212,170,0.12)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${isELI5 ? 'rgba(0,212,170,0.4)' : '#1E2535'}`,
            borderRadius: 20, padding: '4px 12px', cursor: loading ? 'wait' : 'pointer',
            color: isELI5 ? '#00D4AA' : '#8B92A5', fontSize: 11,
            fontFamily: "'DM Mono', monospace", transition: 'all 0.2s',
          }}
        >
          {loading ? (
            <svg width="12" height="12" viewBox="0 0 12 12" style={{ animation: 'spin 0.8s linear infinite' }}>
              <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 8" />
            </svg>
          ) : (
            <span style={{ fontSize: 13 }}>💡</span>
          )}
          {isELI5 ? 'Technical View' : 'Explain Simply (ELI5)'}
        </button>
      </div>

      {isELI5 ? (
        <div style={{ padding: '14px 16px', background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 10 }}>
          <p style={{ fontSize: 10, color: '#00D4AA', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>Plain English — ELI5</p>
          {eli5 ? (
            <p style={{ fontSize: 14, color: '#F0F2F5', lineHeight: 1.7 }}>{eli5}</p>
          ) : (
            <p style={{ fontSize: 13, color: '#8B92A5' }}>No plain English summary available yet.</p>
          )}
        </div>
      ) : (
        content
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
