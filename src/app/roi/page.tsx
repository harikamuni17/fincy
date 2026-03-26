'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import ROISavingsChart from '@/components/charts/ROISavingsChart'
import MetricCard from '@/components/cards/MetricCard'

interface ROIRecord {
  id: string
  predictedSaving: number
  actualSaving: number
  accuracy: number
  measuredAt: string
  periodStart: string
  periodEnd: string
  calculationNote: string
  action: {
    title: string
    actionType: string
    approvalTier: string
    estimatedSavingMonthly: number
    estimatedSavingAnnual: number
    finding: {
      affectedVendor: string | null
      affectedDepartment: string | null
      severity: string
    }
  }
}

export default function ROIPage() {
  const [records, setRecords] = useState<ROIRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [totals, setTotals] = useState({ predicted: 0, actual: 0, accuracy: 0 })
  const [exportingPPTX, setExportingPPTX] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('finci_session_id')
    if (stored) setSessionId(stored)
  }, [])

  useEffect(() => {
    if (!sessionId) { setLoading(false); return }

    fetch(`/api/roi?sessionId=${sessionId}`)
      .then((r) => r.json())
      .then((data: { roiRecords?: ROIRecord[]; totalPredicted?: number; totalActual?: number; avgAccuracy?: number }) => {
        if (data.roiRecords) {
          setRecords(data.roiRecords)
          setTotals({
            predicted: data.totalPredicted ?? 0,
            actual: data.totalActual ?? 0,
            accuracy: data.avgAccuracy ?? 0,
          })
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [sessionId])

  async function handleExportPPTX() {
    setExportingPPTX(true)
    try {
      const topActions = records.slice(0, 3).map(r => ({
        title: r.action.title,
        savingMonthly: r.action.estimatedSavingMonthly,
        savingAnnual: r.action.estimatedSavingAnnual,
      }))
      const res = await fetch('/api/export/pptx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalWaste: totals.actual,
          totalSpend: totals.predicted,
          overspendPct: 28,
          annualSavingsIfActed: totals.predicted,
          topActions,
          score: Math.round(totals.accuracy * 100),
          grade: totals.accuracy >= 0.85 ? 'A' : totals.accuracy >= 0.7 ? 'B' : 'C',
        }),
      })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `finci-board-report-${Date.now()}.pptx`; a.click()
        URL.revokeObjectURL(url)
      }
    } finally {
      setExportingPPTX(false)
    }
  }

  const chartData = records.map((r) => ({
    label: r.action.title.substring(0, 24),
    predicted: r.predictedSaving,
    actual: r.actualSaving,
  }))

  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN')

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <Sidebar sessionStatus={sessionId ? 'COMPLETE' : null} />

      <div style={{ marginLeft: '240px' }}>
        <TopBar
          title="ROI Tracker — Realized Savings"
          sessionStatus={sessionId ? 'COMPLETE' : null}
          sessionId={sessionId}
        />

        <main style={{ paddingTop: '60px' }}>
          <div className="px-8 py-8 space-y-8">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <h2 className="font-display text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Realized Savings vs Predictions
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Tracks how accurately Finci's recommendations performed against predicted savings.
                </p>
              </div>
              <button
                onClick={() => void handleExportPPTX()}
                disabled={exportingPPTX}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.3)', borderRadius: 10, color: '#00D4AA', fontSize: 13, cursor: exportingPPTX ? 'wait' : 'pointer', fontFamily: "'DM Mono', monospace', flexShrink: 0" }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8m0 0L4 6m3 3 3-3M2 12h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                {exportingPPTX ? 'Generating PPTX…' : 'Export Board PPTX'}
              </button>
            </div>

            {/* Metrics row */}
            <div className="grid grid-cols-4 gap-5">
              <MetricCard
                label="Total Predicted"
                value={loading ? '—' : fmt(totals.predicted)}
                sub="Across all executed actions"
                accent="info"
              />
              <MetricCard
                label="Total Actual Savings"
                value={loading ? '—' : fmt(totals.actual)}
                sub="Verified over 30-day period"
                trend={totals.actual > 0 ? { value: '+verified', direction: 'down', isPositive: true } : undefined}
                accent="brand"
              />
              <MetricCard
                label="Prediction Accuracy"
                value={loading ? '—' : `${(totals.accuracy * 100).toFixed(1)}%`}
                sub="Actual / predicted ratio"
                trend={
                  totals.accuracy >= 0.85
                    ? { value: 'Excellent', direction: 'down', isPositive: true }
                    : { value: 'Fair', direction: 'up' }
                }
                accent={totals.accuracy >= 0.85 ? 'brand' : 'warning'}
              />
              <MetricCard
                label="Actions Tracked"
                value={loading ? '—' : records.length.toString()}
                sub="With measured outcomes"
                accent="info"
              />
            </div>

            {/* Chart */}
            <div className="chart-container">
              <p className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
                Predicted vs Actual Savings per Action
              </p>
              {loading ? (
                <div className="skeleton h-[200px]" />
              ) : (
                <ROISavingsChart data={chartData} />
              )}
            </div>

            {/* Records table */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <p className="text-xs uppercase tracking-widest font-medium" style={{ color: 'var(--text-muted)' }}>
                  Action Outcomes Log
                </p>
              </div>

              {loading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton h-12" />
                  ))}
                </div>
              ) : records.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                    No executed actions yet
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Approve and execute actions from the Actions page to start tracking ROI.
                  </p>
                  <a href="/actions" className="btn-outline inline-block mt-4 text-xs" style={{ padding: '6px 16px' }}>
                    Go to Actions →
                  </a>
                </div>
              ) : (
                <table className="finci-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Vendor / Dept</th>
                      <th>Predicted</th>
                      <th>Actual</th>
                      <th>Accuracy</th>
                      <th>Period</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r.id}>
                        <td style={{ maxWidth: '200px' }}>
                          <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {r.action.title.substring(0, 40)}…
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {r.action.actionType.replace(/_/g, ' ')}
                          </p>
                        </td>
                        <td>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {r.action.finding.affectedVendor ?? '—'}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {r.action.finding.affectedDepartment ?? '—'}
                          </p>
                        </td>
                        <td className="font-mono text-xs" style={{ color: 'var(--info)' }}>
                          {fmt(r.predictedSaving)}/mo
                        </td>
                        <td className="font-mono text-xs" style={{ color: 'var(--brand)' }}>
                          {fmt(r.actualSaving)}/mo
                        </td>
                        <td>
                          <span
                            className="font-mono text-xs font-medium"
                            style={{
                              color: r.accuracy >= 0.9 ? 'var(--brand)' :
                                     r.accuracy >= 0.75 ? 'var(--warning)' : 'var(--danger)',
                            }}
                          >
                            {(r.accuracy * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {new Date(r.periodStart).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          {' – '}
                          {new Date(r.periodEnd).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </td>
                        <td
                          className="text-xs"
                          style={{ color: 'var(--text-muted)', maxWidth: '180px' }}
                        >
                          <span className="truncate block">{r.calculationNote.substring(0, 60)}…</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
