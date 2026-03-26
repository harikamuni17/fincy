'use client'

import { calculateCompoundSavings, getEquivalentLabel } from '@/lib/compoundCalc'
import { useState } from 'react'

interface Props {
  annualSaving?: number
}

export default function CompoundCalculator({ annualSaving: defaultSaving = 960000 }: Props) {
  const [annualSaving, setAnnualSaving] = useState(defaultSaving)
  const [years, setYears] = useState(3)
  const [rate, setRate] = useState(12)

  const result = calculateCompoundSavings({ annualSaving, years, reinvestmentRate: rate / 100 })
  const equivalent = getEquivalentLabel(result.totalRecovered)

  return (
    <div style={{ background: '#0D0F14', border: '1px solid #1E2535', borderRadius: 14, padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 10, color: '#4A5065', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>Compound Savings Calculator</p>
        <p style={{ fontSize: 14, color: '#8B92A5' }}>If you reinvest the savings at market rate</p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 150 }}>
          <label style={{ fontSize: 10, color: '#4A5065', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'DM Mono', monospace", display: 'block', marginBottom: 6 }}>Annual Saving (₹)</label>
          <input
            type="number"
            value={annualSaving}
            onChange={e => setAnnualSaving(Math.max(0, Number(e.target.value)))}
            style={{ background: '#0A0B0E', border: '1px solid #1E2535', borderRadius: 8, padding: '8px 12px', color: '#F0F2F5', fontFamily: "'DM Mono', monospace", fontSize: 14, width: '100%' }}
          />
        </div>
        <div style={{ minWidth: 120 }}>
          <label style={{ fontSize: 10, color: '#4A5065', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'DM Mono', monospace", display: 'block', marginBottom: 6 }}>Years</label>
          <select
            value={years}
            onChange={e => setYears(Number(e.target.value))}
            style={{ background: '#0A0B0E', border: '1px solid #1E2535', borderRadius: 8, padding: '8px 12px', color: '#F0F2F5', fontFamily: "'DM Mono', monospace", fontSize: 14 }}
          >
            {[1, 2, 3, 4, 5].map(y => <option key={y} value={y}>{y} yr{y > 1 ? 's' : ''}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 120 }}>
          <label style={{ fontSize: 10, color: '#4A5065', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'DM Mono', monospace", display: 'block', marginBottom: 6 }}>Reinvest Rate</label>
          <select
            value={rate}
            onChange={e => setRate(Number(e.target.value))}
            style={{ background: '#0A0B0E', border: '1px solid #1E2535', borderRadius: 8, padding: '8px 12px', color: '#F0F2F5', fontFamily: "'DM Mono', monospace", fontSize: 14 }}
          >
            {[6, 8, 10, 12, 15, 18].map(r => <option key={r} value={r}>{r}%</option>)}
          </select>
        </div>
      </div>

      {/* Result hero */}
      <div style={{ padding: '18px 20px', background: 'rgba(0,212,170,0.06)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 12, marginBottom: 20 }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 36, color: '#00D4AA', fontWeight: 500 }}>
          ₹{result.totalRecovered.toLocaleString('en-IN')}
        </p>
        <p style={{ fontSize: 13, color: '#8B92A5', marginTop: 4 }}>total recovered over {years} year{years > 1 ? 's' : ''} — equivalent to <span style={{ color: '#F0F2F5' }}>{equivalent}</span></p>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#4A5065', marginTop: 6 }}>{result.effectiveMultiplier}× multiplier · ₹{result.totalCompoundGain.toLocaleString('en-IN')} compound gain</p>
      </div>

      {/* Year breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {result.yearlyBreakdown.map((row) => (
          <div key={row.year} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#4A5065', width: 40, flexShrink: 0 }}>Yr {row.year}</span>
            <div style={{ flex: 1, height: 6, background: '#1E2535', borderRadius: 3 }}>
              <div style={{ height: '100%', width: `${(row.total / result.totalRecovered) * 100}%`, background: '#00D4AA', borderRadius: 3, transition: 'width 0.5s ease-out' }} />
            </div>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#F0F2F5', width: 100, textAlign: 'right' }}>₹{row.total.toLocaleString('en-IN')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
