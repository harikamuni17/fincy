'use client'

import { useEffect, useRef, useState } from 'react'

interface LiveEvent {
  id: string
  vendor: string
  amount: number
  department: string
  category: string
  isAnomaly: boolean
  riskScore: number
  receivedAt: string
}

export default function LiveFeedPanel() {
  const [events, setEvents] = useState<LiveEvent[]>([])
  const [connected, setConnected] = useState(false)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const sessionId = `sess_${Date.now()}`
    const es = new EventSource(`/api/livefeed/stream?sessionId=${sessionId}`)
    esRef.current = es

    es.onopen = () => setConnected(true)
    es.onmessage = (e) => {
      try {
        const ev: LiveEvent = JSON.parse(e.data)
        setEvents(prev => [ev, ...prev].slice(0, 20))
      } catch {}
    }
    es.onerror = () => setConnected(false)

    return () => { es.close() }
  }, [])

  return (
    <div style={{ background: '#0D0F14', border: '1px solid #1E2535', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #1E2535', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? '#00D4AA' : '#FF4D6A', display: 'inline-block', animation: connected ? 'lpulse 1.5s ease-in-out infinite' : 'none' }} />
        <span style={{ fontSize: 12, color: '#F0F2F5', fontWeight: 600 }}>Live Transaction Feed</span>
        <span style={{ fontSize: 10, color: '#4A5065', fontFamily: "'DM Mono', monospace", marginLeft: 'auto' }}>{events.length} events</span>
      </div>

      <div style={{ maxHeight: 320, overflowY: 'auto', padding: '8px 0' }}>
        {events.length === 0 ? (
          <div style={{ padding: '24px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#4A5065' }}>Waiting for transactions…</p>
            <p style={{ fontSize: 11, color: '#4A5065', marginTop: 4 }}>POST to /api/webhook/expense to send data</p>
          </div>
        ) : (
          events.map((ev, i) => (
            <div
              key={ev.id}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 20px', borderBottom: '1px solid #1E2535', animation: i === 0 ? 'slideIn 0.3s ease-out' : 'none', background: ev.isAnomaly ? 'rgba(255,77,106,0.04)' : 'transparent' }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: ev.isAnomaly ? '#FF4D6A' : '#00D4AA', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13, color: ev.isAnomaly ? '#FF4D6A' : '#F0F2F5', fontWeight: 500 }}>{ev.vendor}</span>
                <span style={{ fontSize: 11, color: '#4A5065', marginLeft: 8 }}>{ev.department}</span>
              </div>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#F0F2F5' }}>
                ₹{ev.amount.toLocaleString('en-IN')}
              </span>
              {ev.isAnomaly && (
                <span style={{ fontSize: 10, color: '#FF4D6A', background: 'rgba(255,77,106,0.1)', padding: '2px 8px', borderRadius: 10, flexShrink: 0, fontFamily: "'DM Mono', monospace" }}>
                  ANOMALY
                </span>
              )}
            </div>
          ))
        )}
      </div>

      <style>{`
        @keyframes lpulse { 0%,100% { opacity:0.4; } 50% { opacity:1; } }
        @keyframes slideIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  )
}
