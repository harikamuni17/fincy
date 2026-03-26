'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import ForecastChart from '@/components/charts/ForecastChart'
import ForecastAlertCard from '@/components/cards/ForecastAlertCard'
import LossPrevention from '@/components/LossPrevention'
import { format, addDays } from 'date-fns'

interface ForecastRecordWithDates extends ForecastRecord {
  forecastMonth: string
}

const WEEK_RISK = [
  { week: 'Week 1', riskLevel: 'LOW',    alert: null },
  { week: 'Week 2', riskLevel: 'MEDIUM', alert: 'Cloud spend trending up 12%' },
  { week: 'Week 3', riskLevel: 'HIGH',   alert: 'AWS budget 78% consumed' },
  { week: 'Week 4', riskLevel: 'CRITICAL', alert: 'SLA threshold breach imminent' },
]

export default function ForecastPage() {
  const [forecasts, setForecasts]     = useState<ForecastRecordWithDates[]>([])
  const [loading, setLoading]         = useState(true)
  const [sessionId, setSessionId]     = useState<string | null>(null)
  const [historicalData, setHistoricalData] = useState<{ month: string; amount: number }[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('finci_session_id')
    if (stored) setSessionId(stored)

    // Build 3-month historical from demo data
    const now = new Date()
    setHistoricalData([
      { month: format(addDays(now, -60), 'MMM yyyy'), amount: 2340000 },
      { month: format(addDays(now, -30), 'MMM yyyy'), amount: 2480000 },
      { month: format(now, 'MMM yyyy'),               amount: 2620000 },
    ])
  }, [])

  useEffect(() => {
    if (!sessionId) { setLoading(false); return }

    fetch(`/api/forecast?sessionId=${sessionId}`)
      .then((r) => r.json())
      .then((data: { forecasts?: ForecastRecordWithDates[] }) => {
        if (data.forecasts) setForecasts(data.forecasts)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [sessionId])

  const activeAlerts = forecasts.filter((f) => f.isAlert)
  const highestRisk  = forecasts.find((f) => f.riskCategory === 'CRITICAL') ?? forecasts[0]

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <Sidebar sessionStatus={sessionId ? 'COMPLETE' : null} />

      <div style={{ marginLeft: '240px' }}>
        <TopBar
          title="Loss Prevention — Forecast"
          sessionStatus={sessionId ? 'COMPLETE' : null}
          sessionId={sessionId}
        />

        <main style={{ paddingTop: '60px' }}>
          {/* Active alert banner */}
          {activeAlerts.length > 0 && (
            <div
              className="mx-8 mt-8 px-6 py-5 rounded-xl animate-danger-pulse"
              style={{
                background: 'rgba(255,77,106,0.06)',
                border: '1px solid rgba(255,77,106,0.35)',
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl animate-pulse-brand">⚠️</span>
                  <div>
                    <p className="text-sm font-semibold mb-1" style={{ color: 'var(--danger)' }}>
                      ACTIVE ALERT
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {activeAlerts[0].alertMessage.replace(/^⚠️\s?/, '')}
                    </p>
                  </div>
                </div>
                <a
                  href="/actions"
                  className="btn-danger flex-shrink-0 text-xs"
                  style={{ padding: '6px 14px' }}
                >
                  Prevent This →
                </a>
              </div>
            </div>
          )}

          <div className="px-8 py-8 space-y-8">
            {/* Header */}
            <div>
              <h2 className="font-display text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                What will you LOSE next month?
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Linear regression on your spend trajectory, with seasonal adjustment. Updated after each analysis.
              </p>
            </div>

            {/* Forecast chart */}
            <div className="chart-container">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs uppercase tracking-widest font-medium" style={{ color: 'var(--text-muted)' }}>
                  3-Month Actual + 3-Month Predicted
                </p>
                {highestRisk && (
                  <span
                    className="px-2 py-1 rounded text-xs font-mono font-medium"
                    style={{
                      background:
                        highestRisk.riskCategory === 'CRITICAL' ? 'rgba(255,77,106,0.15)' :
                        highestRisk.riskCategory === 'HIGH' ? 'rgba(255,181,71,0.15)' :
                        'rgba(0,212,170,0.15)',
                      color:
                        highestRisk.riskCategory === 'CRITICAL' ? 'var(--danger)' :
                        highestRisk.riskCategory === 'HIGH' ? 'var(--warning)' :
                        'var(--brand)',
                    }}
                  >
                    {highestRisk.riskCategory} RISK
                  </span>
                )}
              </div>
              {loading ? (
                <div className="skeleton h-[280px]" />
              ) : (
                <ForecastChart
                  historicalData={historicalData}
                  forecastRecords={forecasts as unknown as ForecastRecord[]}
                  budgetLimit={3000000}
                />
              )}
            </div>

            {/* 30-day breakdown + prevention panel */}
            <div className="grid grid-cols-3 gap-6">
              {/* Week breakdown */}
              <div
                className="col-span-2 rounded-xl p-6"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              >
                <p className="text-xs uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
                  30-Day Breakdown
                </p>
                <table className="finci-table">
                  <thead>
                    <tr>
                      <th>Week</th>
                      <th>Projected Spend</th>
                      <th>Risk Level</th>
                      <th>Alert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {WEEK_RISK.map((row, i) => {
                      const fc = forecasts[0]
                      const weekSpend = fc
                        ? Math.round((fc as unknown as { predictedSpend: number }).predictedSpend / 4)
                        : 600000 + i * 50000
                      return (
                        <tr key={row.week}>
                          <td className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                            {row.week}
                          </td>
                          <td
                            className="font-mono"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            ₹{weekSpend.toLocaleString('en-IN')}
                          </td>
                          <td>
                            <span
                              className="px-2 py-0.5 rounded text-xs font-medium"
                              style={{
                                background:
                                  row.riskLevel === 'CRITICAL' ? 'rgba(255,77,106,0.15)' :
                                  row.riskLevel === 'HIGH'     ? 'rgba(255,181,71,0.15)' :
                                  row.riskLevel === 'MEDIUM'   ? 'rgba(108,142,255,0.15)' :
                                  'rgba(0,212,170,0.15)',
                                color:
                                  row.riskLevel === 'CRITICAL' ? 'var(--danger)' :
                                  row.riskLevel === 'HIGH'     ? 'var(--warning)' :
                                  row.riskLevel === 'MEDIUM'   ? 'var(--info)' :
                                  'var(--brand)',
                              }}
                            >
                              {row.riskLevel}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                            {row.alert ?? '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Forecast alert cards */}
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  Active Alerts
                </p>
                {loading ? (
                  <>
                    <div className="skeleton h-24" />
                    <div className="skeleton h-24" />
                  </>
                ) : forecasts.length === 0 ? (
                  <div
                    className="rounded-xl p-5 text-center"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
                  >
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Load demo data to see forecast alerts
                    </p>
                  </div>
                ) : (
                  forecasts.map((fc) => (
                    <ForecastAlertCard
                      key={fc.id}
                      forecast={fc as unknown as import('@/types').ForecastRecord}
                      nextMonthWaste={Math.round((fc as unknown as { predictedWaste: number }).predictedWaste)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Loss prevention panel */}
            <LossPrevention
              alerts={forecasts.map((fc) => ({
                message: fc.alertMessage,
                predictedLoss: Math.round((fc as unknown as { predictedWaste: number }).predictedWaste),
                daysUntil: 30,
                severity: (fc.riskCategory === 'CRITICAL' ? 'CRITICAL' :
                           fc.riskCategory === 'HIGH'     ? 'HIGH' :
                           fc.riskCategory === 'MEDIUM'   ? 'MEDIUM' : 'LOW') as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
              }))}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
