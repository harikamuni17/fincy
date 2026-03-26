'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle, Loader2, Circle, Zap } from 'lucide-react'

type Stage = 'analyzer' | 'decision' | 'action' | 'forecast' | 'done'
type Status = 'waiting' | 'running' | 'complete' | 'error'

interface StageState {
  status: Status
  message: string
  count?: number
}

interface AgentProgressTrackerProps {
  sessionId: string
  onComplete?: (data: {
    totalFindings: number
    totalActions: number
    estimatedAnnualSavings: number
  }) => void
  onStart?: () => void
}

const STAGES: { key: Stage; label: string; icon: string }[] = [
  { key: 'analyzer', label: 'Analyzer',  icon: '⚡' },
  { key: 'decision', label: 'Decision',  icon: '🧠' },
  { key: 'action',   label: 'Action',    icon: '⚡' },
  { key: 'forecast', label: 'Monitor',   icon: '👁' },
]

export default function AgentProgressTracker({
  sessionId,
  onComplete,
  onStart,
}: AgentProgressTrackerProps) {
  const [stages, setStages] = useState<Record<Stage, StageState>>({
    analyzer: { status: 'waiting', message: 'Waiting...' },
    decision: { status: 'waiting', message: 'Waiting...' },
    action:   { status: 'waiting', message: 'Waiting...' },
    forecast: { status: 'waiting', message: 'Waiting...' },
    done:     { status: 'waiting', message: '' },
  })
  const [totalSavings, setTotalSavings] = useState<number | null>(null)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!sessionId) return
    if (onStart) onStart()

    const es = new EventSource(`/api/analyze?sessionId=${sessionId}`)
    esRef.current = es

    es.onmessage = (ev) => {
      const data = JSON.parse(ev.data) as {
        stage: Stage
        status: 'running' | 'complete' | 'error'
        message: string
        count?: number
        totalFindings?: number
        totalActions?: number
        estimatedAnnualSavings?: number
      }

      if (data.stage === 'done') {
        setStages((prev) => ({
          ...prev,
          analyzer: { ...prev.analyzer, status: 'complete' },
          decision: { ...prev.decision, status: 'complete' },
          action:   { ...prev.action,   status: 'complete' },
          forecast: { ...prev.forecast, status: 'complete' },
        }))
        if (data.estimatedAnnualSavings) {
          setTotalSavings(data.estimatedAnnualSavings)
        }
        if (onComplete && data.totalFindings !== undefined) {
          onComplete({
            totalFindings: data.totalFindings,
            totalActions: data.totalActions ?? 0,
            estimatedAnnualSavings: data.estimatedAnnualSavings ?? 0,
          })
        }
        es.close()
        return
      }

      if (data.stage in stages) {
        setStages((prev) => ({
          ...prev,
          [data.stage]: {
            status: data.status === 'running' ? 'running' : data.status === 'error' ? 'error' : 'complete',
            message: data.message,
            count: data.count,
          },
        }))
      }
    }

    es.onerror = () => {
      setStages((prev) => {
        const updated = { ...prev }
        for (const key of Object.keys(updated) as Stage[]) {
          if (updated[key].status === 'running') {
            updated[key] = { ...updated[key], status: 'error' }
          }
        }
        return updated
      })
      es.close()
    }

    return () => { es.close() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  return (
    <div
      className="rounded-xl p-5 animate-fade-in"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-2 mb-5">
        <Zap size={14} style={{ color: 'var(--brand)' }} />
        <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
          AI Agent Pipeline
        </p>
      </div>

      {/* Steps row */}
      <div className="flex items-start gap-0">
        {STAGES.map((stage, idx) => {
          const state = stages[stage.key]
          const isLast = idx === STAGES.length - 1
          return (
            <div key={stage.key} className="flex items-start flex-1">
              <div className="flex flex-col items-center flex-1">
                {/* Icon */}
                <div className="relative mb-2">
                  {state.status === 'complete' ? (
                    <CheckCircle size={22} style={{ color: 'var(--brand)' }} />
                  ) : state.status === 'running' ? (
                    <Loader2 size={22} className="animate-spin" style={{ color: 'var(--warning)' }} />
                  ) : state.status === 'error' ? (
                    <Circle size={22} style={{ color: 'var(--danger)' }} />
                  ) : (
                    <Circle size={22} style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>
                {/* Label */}
                <p
                  className="text-xs font-medium text-center mb-1"
                  style={{
                    color: state.status === 'complete' ? 'var(--brand)' :
                           state.status === 'running'  ? 'var(--warning)' :
                           state.status === 'error'    ? 'var(--danger)' :
                           'var(--text-muted)',
                  }}
                >
                  {stage.icon} {stage.label}
                </p>
                {/* Status */}
                <p
                  className="text-[10px] text-center leading-snug px-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {state.status === 'running' ? state.message :
                   state.status === 'complete' && state.count !== undefined
                    ? `✓ ${state.count} found`
                    : state.status === 'complete'
                    ? '✓ Done'
                    : state.status === 'error'
                    ? '✕ Error'
                    : '○ Waiting'}
                </p>
              </div>
              {/* Connector line */}
              {!isLast && (
                <div
                  className="flex-shrink-0 h-[1px] w-8 mt-2.5"
                  style={{
                    background: state.status === 'complete' ? 'var(--brand)' : 'var(--border)',
                    transition: 'background 400ms ease',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Total savings */}
      {totalSavings !== null && (
        <div
          className="mt-4 pt-4 text-center animate-slide-up"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
            Estimated annual savings identified
          </p>
          <p className="text-2xl font-mono font-bold animate-pulse-brand" style={{ color: 'var(--brand)' }}>
            ₹{totalSavings.toLocaleString('en-IN')}
          </p>
        </div>
      )}
    </div>
  )
}
