'use client'

import { useState, useMemo } from 'react'
import type { Expense } from '@/types'

interface DepartmentComparisonProps {
  expenses: Expense[]
  headcounts?: Record<string, number>
}

const DEFAULT_HEADCOUNTS: Record<string, number> = {
  Engineering: 45,
  Marketing: 12,
  Sales: 28,
  Operations: 18,
  Finance: 8,
}

interface DeptData {
  name: string
  totalSpend: number
  transactionCount: number
  uniqueVendors: number
  avgTransaction: number
  perHeadSpend: number
  isOutlier: boolean
}

type Toggle = 'total' | 'perHead'

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

export default function DepartmentComparison({ expenses, headcounts }: DepartmentComparisonProps) {
  const hc = headcounts ?? DEFAULT_HEADCOUNTS
  const [toggle, setToggle] = useState<Toggle>('total')

  const depts = useMemo(() => {
    const map = new Map<string, { total: number; txns: number; vendors: Set<string> }>()
    for (const exp of expenses) {
      const dept = exp.department ?? 'Unknown'
      if (!map.has(dept)) map.set(dept, { total: 0, txns: 0, vendors: new Set() })
      const d = map.get(dept)!
      d.total += exp.amount
      d.txns += 1
      d.vendors.add(exp.vendor)
    }

    const result: DeptData[] = []
    map.forEach((v, name) => {
      const headcount = hc[name] ?? 10
      const perHead = v.total / headcount
      result.push({
        name,
        totalSpend: v.total,
        transactionCount: v.txns,
        uniqueVendors: v.vendors.size,
        avgTransaction: v.txns > 0 ? v.total / v.txns : 0,
        perHeadSpend: perHead,
        isOutlier: false,
      })
    })

    const med = median(result.map((d) => d.perHeadSpend))
    result.forEach((d) => {
      d.isOutlier = d.perHeadSpend > med * 2
    })

    return result.sort((a, b) => b.totalSpend - a.totalSpend)
  }, [expenses, hc])

  const maxValue = depts.length > 0
    ? Math.max(...depts.map((d) => toggle === 'total' ? d.totalSpend : d.perHeadSpend))
    : 1

  const outlier = depts.find((d) => d.isOutlier)
  const med = median(depts.map((d) => d.perHeadSpend))

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 24,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>
            Department Comparison
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Spend efficiency by team</p>
        </div>
        <div style={{ display: 'flex', gap: 0, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          {(['total', 'perHead'] as Toggle[]).map((t) => (
            <button
              key={t}
              onClick={() => setToggle(t)}
              style={{
                padding: '5px 12px',
                fontSize: 11,
                background: toggle === t ? 'var(--brand)' : 'transparent',
                color: toggle === t ? '#000' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: toggle === t ? 600 : 400,
              }}
            >
              {t === 'total' ? 'Total' : 'Per person'}
            </button>
          ))}
        </div>
      </div>

      {depts.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0', fontSize: 13 }}>
          No expense data available
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {depts.map((dept) => {
            const value = toggle === 'total' ? dept.totalSpend : dept.perHeadSpend
            const barWidth = maxValue > 0 ? (value / maxValue) * 100 : 0
            const barColor = dept.isOutlier ? '#FF4D6A' : 'var(--brand)'

            return (
              <div key={dept.name}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <p style={{ width: 100, fontSize: 12, color: 'var(--text-primary)', flexShrink: 0 }}>
                    {dept.name}
                    {dept.isOutlier && <span style={{ color: '#FF4D6A', marginLeft: 4 }}>⚠</span>}
                  </p>
                  <div style={{ flex: 1, height: 20, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${barWidth}%`,
                        background: barColor,
                        borderRadius: 4,
                        opacity: dept.isOutlier ? 1 : 0.7 + (barWidth / 100) * 0.3,
                        transition: 'width 600ms ease-out',
                      }}
                    />
                  </div>
                  <p
                    style={{
                      width: 100,
                      textAlign: 'right',
                      fontSize: 12,
                      color: dept.isOutlier ? '#FF4D6A' : 'var(--text-primary)',
                      fontFamily: "'DM Mono', monospace",
                      flexShrink: 0,
                    }}
                  >
                    ₹{value.toLocaleString('en-IN')}
                  </p>
                </div>
                {toggle === 'perHead' && (
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 110, marginTop: 1 }}>
                    ₹{dept.perHeadSpend.toLocaleString('en-IN')}/person
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {outlier && (
        <div
          style={{
            marginTop: 16,
            background: 'rgba(255,77,106,0.06)',
            borderLeft: '2px solid #FF4D6A',
            borderRadius: '0 8px 8px 0',
            padding: '10px 14px',
          }}
        >
          <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
            ⚠ <strong>{outlier.name}</strong> is spending{' '}
            {med > 0 ? (outlier.perHeadSpend / med).toFixed(1) : '2+'}× the company median per person.
            This accounts for ₹
            {Math.max(0, outlier.perHeadSpend - med).toLocaleString('en-IN')}
            /person in excess spend.
          </p>
        </div>
      )}
    </div>
  )
}
