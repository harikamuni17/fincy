'use client'

import { useMemo, useState } from 'react'
import type { Expense } from '@/types'

interface SpendHeatmapProps {
  expenses: Expense[]
  sessionId: string
}

const CELL_COLORS = [
  '#1A1D24',
  '#0a3d2e',
  '#0f6e56',
  '#1D9E75',
  '#00D4AA',
]
const ANOMALY_COLOR = '#FF4D6A'

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function getZScore(values: number[], val: number): number {
  if (values.length === 0) return 0
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length
  const std = Math.sqrt(variance)
  return std === 0 ? 0 : (val - mean) / std
}

interface DayData {
  dateKey: string
  total: number
  count: number
  intensity: number
  isAnomaly: boolean
  expenses: Expense[]
}

function buildDayMap(expenses: Expense[]): Map<string, DayData> {
  const map = new Map<string, DayData>()
  for (const exp of expenses) {
    const d = new Date(exp.date as unknown as string)
    const key = formatDateKey(d)
    if (!map.has(key)) {
      map.set(key, { dateKey: key, total: 0, count: 0, intensity: 0, isAnomaly: false, expenses: [] })
    }
    const entry = map.get(key)!
    entry.total += exp.amount
    entry.count += 1
    entry.expenses.push(exp)
  }
  return map
}

export default function SpendHeatmap({ expenses }: SpendHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; data: DayData } | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const { weeks, maxTotal, dayMap } = useMemo(() => {
    const dayMap = buildDayMap(expenses)
    const totals = Array.from(dayMap.values()).map((d) => d.total)
    const maxT = totals.length > 0 ? Math.max(...totals) : 1

    // Mark anomalies
    dayMap.forEach((d) => {
      const zScore = getZScore(totals, d.total)
      d.isAnomaly = zScore > 2.0
      d.intensity = Math.min(Math.floor((d.total / maxT) * 5), 4)
    })

    // Build 13-week grid ending today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(today)
    // go to end of current week (Sunday)
    endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()))

    const start = new Date(endOfWeek)
    start.setDate(start.getDate() - 12 * 7 - 6) // 13 weeks back

    const weeks: (DayData | null)[][] = []
    let current = new Date(start)
    // Start on Monday
    current.setDate(current.getDate() - current.getDay() + 1)

    for (let w = 0; w < 13; w++) {
      const week: (DayData | null)[] = []
      for (let d = 0; d < 7; d++) {
        const key = formatDateKey(current)
        week.push(dayMap.get(key) ?? null)
        current.setDate(current.getDate() + 1)
      }
      weeks.push(week)
    }

    return { weeks, maxTotal: maxT, dayMap }
  }, [expenses])

  const selectedDayData = selectedDate ? dayMap.get(selectedDate) : null

  function cellColor(data: DayData | null): string {
    if (!data || data.total === 0) return CELL_COLORS[0]
    if (data.isAnomaly) return ANOMALY_COLOR
    return CELL_COLORS[data.intensity]
  }

  const GAP = 3
  const CELL = 14

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>
          Spend calendar — 90 days
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          Click any day to inspect transactions
        </p>
      </div>

      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start', position: 'relative' }}>
        {/* Day labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, paddingTop: 20 }}>
          {['M', '', 'W', '', 'F', '', ''].map((label, i) => (
            <div key={i} style={{ height: CELL, width: 12, fontSize: 9, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              {label}
            </div>
          ))}
        </div>

        {/* Weeks grid */}
        <div onMouseLeave={() => setTooltip(null)}>
          {/* Month labels row */}
          <div style={{ display: 'flex', gap: GAP, marginBottom: 4, height: 16 }}>
            {weeks.map((week, wi) => {
              const firstDay = week.find(Boolean)
              if (!firstDay) return <div key={wi} style={{ width: CELL }} />
              const date = new Date(firstDay.dateKey)
              const showMonth = date.getDate() <= 7
              return (
                <div key={wi} style={{ width: CELL, fontSize: 9, color: 'var(--text-muted)' }}>
                  {showMonth ? date.toLocaleString('default', { month: 'short' }) : ''}
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: GAP }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
                {week.map((day, di) => (
                  <div
                    key={di}
                    style={{
                      width: CELL,
                      height: CELL,
                      borderRadius: 3,
                      background: cellColor(day),
                      cursor: day ? 'pointer' : 'default',
                      outline: selectedDate === day?.dateKey ? '1px solid var(--brand)' : 'none',
                      transition: 'opacity 150ms',
                    }}
                    onMouseEnter={(e) => {
                      if (!day) return
                      const rect = (e.target as HTMLElement).getBoundingClientRect()
                      setTooltip({ x: rect.left, y: rect.top, data: day })
                    }}
                    onClick={() => day && setSelectedDate(day.dateKey === selectedDate ? null : day.dateKey)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x + 18,
            top: tooltip.y - 60,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 11,
            zIndex: 9999,
            pointerEvents: 'none',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            minWidth: 160,
          }}
        >
          <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{tooltip.data.dateKey}</p>
          <p style={{ color: 'var(--text-secondary)', marginTop: 2 }}>
            ₹{tooltip.data.total.toLocaleString('en-IN')} · {tooltip.data.count} txns
          </p>
          {tooltip.data.isAnomaly && (
            <span style={{ color: '#FF4D6A', fontSize: 10, fontWeight: 600 }}>ANOMALY</span>
          )}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Less</span>
        {CELL_COLORS.map((c, i) => (
          <div key={i} style={{ width: 11, height: 11, borderRadius: 2, background: c }} />
        ))}
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>More</span>
        <div style={{ width: 11, height: 11, borderRadius: 2, background: ANOMALY_COLOR, marginLeft: 8 }} />
        <span style={{ fontSize: 10, color: ANOMALY_COLOR }}>Anomaly</span>
      </div>

      {/* Selected day detail */}
      {selectedDayData && (
        <div
          style={{
            marginTop: 16,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
              {selectedDate} — ₹{selectedDayData.total.toLocaleString('en-IN')} total
              {selectedDayData.isAnomaly && (
                <span style={{ marginLeft: 8, color: '#FF4D6A', fontSize: 11 }}>ANOMALY</span>
              )}
            </p>
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)' }}>
                  {['Vendor', 'Amount', 'Category', 'Department'].map((h) => (
                    <th key={h} style={{ padding: '6px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500, fontSize: 11 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedDayData.expenses.map((exp) => (
                  <tr
                    key={exp.id}
                    style={{
                      borderLeft: selectedDayData.isAnomaly ? '2px solid #FF4D6A' : 'none',
                    }}
                  >
                    <td style={{ padding: '6px 12px', color: 'var(--text-primary)' }}>{exp.vendor}</td>
                    <td style={{ padding: '6px 12px', color: 'var(--brand)', fontFamily: "'DM Mono', monospace" }}>
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '6px 12px', color: 'var(--text-secondary)' }}>{exp.category}</td>
                    <td style={{ padding: '6px 12px', color: 'var(--text-secondary)' }}>{exp.department ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suppress unused variable warning */}
      <span style={{ display: 'none' }}>{maxTotal}</span>
    </div>
  )
}
