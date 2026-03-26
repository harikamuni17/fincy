'use client'

import { useState } from 'react'
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
  const [reductionPct, setReductionPct] = useState(60)
  const [includeImplCost, setIncludeImplCost] = useState(false)
  const [implCost, setImplCost] = useState(50000)
  const [baselineData, setBaselineData] = useState<MonthlyDataPoint[]>(initialBaselineData)
  const [projectedData, setProjectedData] = useState<MonthlyDataPoint[]>(initialProjectedData)
  const [saving3m, setSaving3m] = useState(initialSaving3m)
  const [saving12m, setSaving12m] = useState(initialSaving12m)
  const [loading, setLoading] = useState(false)

  async function runSimulation(pct: number) {
    setLoading(true)
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionLogId, scenarioParams: { reductionPercent: pct } }),
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

  function handleReductionChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10)
    setReductionPct(val)
    void runSimulation(val)
  }

  const adjustedSaving12m = includeImplCost ? Math.max(0, saving12m - implCost) : saving12m
  const breakEven = includeImplCost && saving12m > 0
    ? parseFloat((implCost / (saving12m / 12)).toFixed(1))
    : 0

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
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '3-Month Saving', value: saving3m },
          { label: '12-Month Saving', value: adjustedSaving12m },
          { label: 'Break-Even', value: breakEven, suffix: ' mo', plain: true },
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
              {m.plain
                ? `${m.value}${m.suffix ?? ''}`
                : '₹' + m.value.toLocaleString('en-IN')}
            </p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div
        className="rounded-xl p-5 space-y-5"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
      >
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Scenario Parameters
        </p>

        <div>
          <div className="flex justify-between text-xs mb-2">
            <span style={{ color: 'var(--text-secondary)' }}>License / cost reduction %</span>
            <span className="font-mono" style={{ color: 'var(--brand)' }}>{reductionPct}%</span>
          </div>
          <input
            type="range"
            min={10} max={90} step={5}
            value={reductionPct}
            onChange={handleReductionChange}
            disabled={loading}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIncludeImplCost(!includeImplCost)}
            className={`w-10 h-5 rounded-full transition-colors relative ${includeImplCost ? 'bg-brand' : 'bg-bg-elevated border border-border-bright'}`}
            style={{ background: includeImplCost ? 'var(--brand)' : 'var(--bg-surface)' }}
          >
            <span
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
              style={{ transform: includeImplCost ? 'translateX(20px)' : 'translateX(2px)' }}
            />
          </button>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Include implementation cost</span>
          {includeImplCost && (
            <input
              type="number"
              value={implCost}
              onChange={(e) => setImplCost(parseInt(e.target.value, 10) || 0)}
              className="finci-input text-xs w-32 ml-auto"
              placeholder="₹ implementation cost"
            />
          )}
        </div>
      </div>
    </div>
  )
}
