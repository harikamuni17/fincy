'use client'

import { useState, useEffect } from 'react'
import SimulationChart from '@/components/charts/SimulationChart'
import type { MonthlyDataPoint } from '@/types'

interface ScenarioSimulatorProps {
  actionLogId: string
  initialBaselineData?: MonthlyDataPoint[]
  initialProjectedData?: MonthlyDataPoint[]
  initialSaving3m?: number
  initialSaving12m?: number
}

export default function ScenarioSimulator({
  actionLogId,
  initialBaselineData = [],
  initialProjectedData = [],
  initialSaving3m = 0,
  initialSaving12m = 0,
}: ScenarioSimulatorProps) {
  const [baselineData, setBaselineData] = useState<MonthlyDataPoint[]>(initialBaselineData)
  const [projectedData, setProjectedData] = useState<MonthlyDataPoint[]>(initialProjectedData)
  const [saving3m, setSaving3m] = useState(initialSaving3m)
  const [saving12m, setSaving12m] = useState(initialSaving12m)
  const [loading, setLoading] = useState(false)

  async function loadSimulation() {
    if (!actionLogId) return
    setLoading(true)
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionLogId }),
      })
      if (res.ok) {
        const data = await res.json() as {
          baselineData: MonthlyDataPoint[]
          projectedData: MonthlyDataPoint[]
          saving3m: number
          saving12m: number
        }
        setBaselineData(data.baselineData)
        setProjectedData(data.projectedData)
        setSaving3m(data.saving3m)
        setSaving12m(data.saving12m)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadSimulation()
  }, [actionLogId])

  const adjustedSaving12m = saving12m

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="chart-container">
        <SimulationChart
          baselineData={baselineData}
          projectedData={projectedData}
          todayIndex={baselineData.length - 1}
        />
      </div>

      {/* Metric pills */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: '3-Month Saving', value: saving3m },
          { label: '12-Month Saving', value: adjustedSaving12m },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl p-4 text-center"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
              {m.label}
            </p>
            <p className="text-2xl font-mono font-semibold" style={{ color: 'var(--brand)' }}>
              {'₹' + m.value.toLocaleString('en-IN')}
            </p>
          </div>
        ))}
      </div>

      <div
        className="rounded-xl p-5"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Estimated impact is generated automatically for the selected action.
        </p>
        {loading && (
          <p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>
            Loading simulation results...
          </p>
        )}
      </div>
    </div>
  )
}
