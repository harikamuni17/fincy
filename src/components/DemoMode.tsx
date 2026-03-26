'use client'

import { useState, useEffect } from 'react'
import { useWasteTicker } from '@/hooks/useWasteTicker'

interface DemoModeProps {
  annualWaste?: number
  totalSpend?: number
  topActions?: { title: string; savingMonthly: number; savingAnnual: number; confidence: number }[]
  overspendPct?: number
  topWasteCategory?: string
  nextMonthWaste?: number
  score?: number
  grade?: string
  scoreColor?: string
}

const TICKER_EVENTS = [
  '● Slack alert sent to Engineering',
  '● AWS anomaly detected ₹7,560/mo',
  '● Vendor TechSoft frozen',
  '● FINCI-A3K2 ticket created',
  '● Figma license overuse detected',
  '● Travel overrun flagged ₹12,000/mo',
  '● Duplicate billing blocked',
  '● CFO report exported',
]

export default function DemoMode({
  annualWaste = 960000,
  topActions = [],
  overspendPct = 28,
  topWasteCategory = 'Cloud Infrastructure',
  nextMonthWaste = 80000,
  score = 62,
  grade = 'C',
  scoreColor = '#FFB547',
}: DemoModeProps) {
  const { formattedValue } = useWasteTicker(annualWaste)
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const totalAnnual = topActions.reduce((s, a) => s + a.savingAnnual, 0) || 960000
  const CIRC = 2 * Math.PI * 52

  const defaultActions = topActions.length > 0 ? topActions : [
    { title: 'Switch AWS to Reserved Instances', savingMonthly: 52000, savingAnnual: 624000, confidence: 0.94 },
    { title: 'Reduce Figma seat count from 80→35', savingMonthly: 13500, savingAnnual: 162000, confidence: 0.88 },
    { title: 'Dispute TechSoft duplicate billing', savingMonthly: 10000, savingAnnual: 120000, confidence: 0.97 },
  ]

  const tickerText = [...TICKER_EVENTS, ...TICKER_EVENTS].join('  ·  ')

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0A0B0E', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'fixed', inset: 0, zIndex: 1000 }}>

      {/* TOP STRIP */}
      <div style={{ height: 60, borderBottom: '1px solid #1E2535', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 700, color: '#00D4AA' }}>fi</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 700, color: '#F0F2F5' }}>nci</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00D4AA', display: 'inline-block', animation: 'waste-pulse 1.5s ease-in-out infinite' }} />
            <span style={{ fontSize: 11, color: '#00D4AA', fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em' }}>LIVE ANALYSIS</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#F0F2F5' }}>{time}</span>
          <span style={{ fontSize: 11, color: '#4A5065' }}>Press F to exit</span>
        </div>
      </div>

      {/* HERO ROW */}
      <div style={{ padding: '32px 60px 24px', borderBottom: '1px solid #1E2535', display: 'flex', alignItems: 'center', gap: 40, flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, color: '#8B92A5', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>Current Analysis Session</p>
          <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 36, color: '#F0F2F5', lineHeight: 1.2, fontWeight: 700 }}>
            Overspending {overspendPct}% · <span style={{ color: '#FF4D6A' }}>{topWasteCategory}</span> is the main driver
          </p>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 48, color: '#00D4AA', marginTop: 12, fontWeight: 500 }}>
            ₹{totalAnnual.toLocaleString('en-IN')} recoverable annually
          </p>
        </div>
        {/* Mini score ring */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <svg width="140" height="140" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#1E2535" strokeWidth="10" />
            <circle cx="60" cy="60" r="52" fill="none" stroke={scoreColor} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={CIRC} strokeDashoffset={CIRC - (CIRC * score / 100)}
              transform="rotate(-90 60 60)" style={{ transition: 'stroke-dashoffset 1.2s ease-out' }} />
            <text x="60" y="64" textAnchor="middle" fill={scoreColor} fontSize="28" fontFamily="'DM Mono', monospace" fontWeight="500">{score}</text>
            <text x="60" y="82" textAnchor="middle" fill="#8B92A5" fontSize="11" fontFamily="'DM Mono', monospace">{grade} · /100</text>
          </svg>
          <p style={{ fontSize: 12, color: scoreColor, marginTop: 4 }}>Budget Health</p>
        </div>
      </div>

      {/* MAIN ROW */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT — TOP ACTIONS */}
        <div style={{ width: '35%', borderRight: '1px solid #1E2535', padding: '28px 36px', overflow: 'auto' }}>
          <p style={{ fontSize: 10, color: '#4A5065', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20, fontFamily: "'DM Mono', monospace" }}>TOP 3 ACTIONS</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {defaultActions.map((a, i) => (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,212,170,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, color: '#00D4AA', fontWeight: 700 }}>{i + 1}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, color: '#F0F2F5', lineHeight: 1.4, marginBottom: 4 }}>{a.title}</p>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, color: '#00D4AA' }}>₹{a.savingMonthly.toLocaleString('en-IN')}/mo</p>
                  </div>
                </div>
                <div style={{ height: 3, background: '#1E2535', borderRadius: 2, marginTop: 10, marginLeft: 54 }}>
                  <div style={{ height: '100%', width: `${a.confidence * 100}%`, background: '#00D4AA', borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #1E2535', marginTop: 24, paddingTop: 16 }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 24, color: '#00D4AA' }}>₹{totalAnnual.toLocaleString('en-IN')}</p>
            <p style={{ fontSize: 12, color: '#8B92A5', marginTop: 2 }}>total annual saving</p>
          </div>
        </div>

        {/* CENTER — placeholder chart area */}
        <div style={{ flex: 1, borderRight: '1px solid #1E2535', padding: '28px 32px', display: 'flex', flexDirection: 'column' }}>
          <p style={{ fontSize: 10, color: '#4A5065', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16, fontFamily: "'DM Mono', monospace" }}>SPEND TREND</p>
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            {[720, 745, 875, 920, 960].map((v, i) => {
              const isForecast = i >= 3
              const pct = (v / 1000) * 100
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: '100%', height: `${pct * 1.8}px`, background: isForecast ? 'rgba(255,77,106,0.3)' : 'rgba(0,212,170,0.4)', border: `1px solid ${isForecast ? '#FF4D6A' : '#00D4AA'}`, borderRadius: '4px 4px 0 0', borderStyle: isForecast ? 'dashed' : 'solid' }} />
                  <p style={{ fontSize: 10, color: '#4A5065', fontFamily: "'DM Mono', monospace" }}>{['J', 'F', 'M', 'A', 'M'][i]}</p>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 3, background: '#00D4AA' }} /><span style={{ fontSize: 10, color: '#4A5065' }}>Actual</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 12, height: 3, background: '#FF4D6A', borderTop: '1px dashed #FF4D6A' }} /><span style={{ fontSize: 10, color: '#4A5065' }}>Projected</span></div>
          </div>
        </div>

        {/* RIGHT — Waste ticker + forecast */}
        <div style={{ width: '25%', padding: '28px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <p style={{ fontSize: 10, color: '#4A5065', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>WASTE TICKER</p>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 40, color: '#FF4D6A', fontWeight: 500, lineHeight: 1.1 }}>{formattedValue}</p>
            <p style={{ fontSize: 11, color: '#4A5065', marginTop: 6 }}>since session started</p>
          </div>
          <div style={{ borderTop: '1px solid #1E2535', paddingTop: 20 }}>
            <p style={{ fontSize: 10, color: '#4A5065', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>30-DAY FORECAST</p>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 28, color: '#FFB547', fontWeight: 500 }}>₹{nextMonthWaste.toLocaleString('en-IN')}</p>
            <p style={{ fontSize: 11, color: '#FFB547', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFB547', display: 'inline-block', animation: 'waste-pulse 1.5s ease-in-out infinite' }} />
              projected waste next 30 days
            </p>
          </div>
        </div>
      </div>

      {/* BOTTOM TICKER */}
      <div style={{ height: 44, borderTop: '1px solid #1E2535', overflow: 'hidden', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'inline-block', whiteSpace: 'nowrap', animation: 'marquee 20s linear infinite', fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#4A5065' }}>
          {tickerText}
        </div>
      </div>

      <style>{`
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes waste-pulse { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
      `}</style>
    </div>
  )
}
