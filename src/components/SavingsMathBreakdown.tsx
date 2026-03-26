'use client'

import type { CalculationStep } from '@/types'

interface SavingsMathBreakdownProps {
  steps: CalculationStep[]
  annualProjection: number
}

function formatValue(step: CalculationStep): string {
  switch (step.unit) {
    case 'INR':     return '₹' + step.value.toLocaleString('en-IN')
    case 'percent': return `${step.value}%`
    case 'zscore':  return `${step.value}σ`
    case 'count':   return step.value.toLocaleString('en-IN')
    case 'months':  return `${step.value} mo`
    default:        return String(step.value)
  }
}

function isWasteStep(step: CalculationStep): boolean {
  return ['delta', 'annual_projection', 'z_score'].includes(step.step)
}

function isSavingsStep(step: CalculationStep): boolean {
  return ['confidence'].includes(step.step)
}

const STEP_LABELS: Record<string, string> = {
  baseline_avg:      'Baseline average',
  current_value:     'Current month',
  delta:             'Monthly delta',
  z_score:           'Z-score',
  confidence:        'Confidence',
  annual_projection: 'Annual risk',
}

export default function SavingsMathBreakdown({ steps, annualProjection }: SavingsMathBreakdownProps) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
    >
      <div className="px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          How we calculated this
        </p>
      </div>

      <table className="finci-table">
        <thead>
          <tr>
            <th style={{ width: '32%' }}>Step</th>
            <th style={{ width: '24%' }}>Value</th>
            <th>Explanation</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((step) => (
            <tr key={step.step}>
              <td style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                {STEP_LABELS[step.step] ?? step.step.replace(/_/g, ' ')}
              </td>
              <td
                className="font-mono"
                style={{
                  color: isWasteStep(step)
                    ? 'var(--danger)'
                    : isSavingsStep(step)
                    ? 'var(--brand)'
                    : 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 500,
                }}
              >
                {formatValue(step)}
              </td>
              <td style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                {step.explanation}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Annual risk footer */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderTop: '1px solid var(--border)', background: 'rgba(255,77,106,0.06)' }}
      >
        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          Annual risk if unaddressed
        </span>
        <span
          className="text-base font-mono font-bold"
          style={{ color: 'var(--danger)' }}
        >
          ₹{annualProjection.toLocaleString('en-IN')}
        </span>
      </div>
    </div>
  )
}
