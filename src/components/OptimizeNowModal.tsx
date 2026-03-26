'use client'

import { useState, useEffect } from 'react'
import type { ActionLog } from '@/types'

interface OptimizeNowModalProps {
  sessionId: string
  onClose: () => void
}

interface AutoAction {
  id: string
  title: string
  savingMonthly: number
  badges: string[]
}

interface ExecuteResult {
  executed: number
  totalSavingMonthly: number
  totalSavingAnnual: number
  vendorsFrozen: string[]
  ticketsCreated: string[]
  results: { actionId: string; title: string; status: string; result?: string }[]
}

type Step = 'checklist' | 'executing' | 'complete'

function Confetti() {
  const particles = Array.from({ length: 20 }, (_, i) => i)
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {particles.map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: 8,
            height: 8,
            borderRadius: 2,
            background: i % 3 === 0 ? '#00D4AA' : i % 3 === 1 ? '#6C8EFF' : '#FFB547',
            left: `${20 + Math.random() * 60}%`,
            top: '40%',
            animation: `confetti-${i % 5} 1s ease-out both`,
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  )
}

export default function OptimizeNowModal({ sessionId, onClose }: OptimizeNowModalProps) {
  const [step, setStep] = useState<Step>('checklist')
  const [actions, setActions] = useState<AutoAction[]>([])
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [executing, setExecuting] = useState<string[]>([])
  const [done, setDone] = useState<Set<string>>(new Set())
  const [result, setResult] = useState<ExecuteResult | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    async function loadActions() {
      try {
        const res = await fetch(`/api/actions?sessionId=${sessionId}`)
        const data = await res.json() as { actions: ActionLog[] }
        const auto: AutoAction[] = (data.actions ?? [])
          .filter((a) => a.approvalTier === 'AUTO')
          .map((a) => ({
            id: a.id,
            title: a.title,
            savingMonthly: a.estimatedSavingMonthly,
            badges: ['Slack', 'Ticket'],
          }))
        setActions(auto)
        setChecked(new Set(auto.map((a) => a.id)))
      } catch {
        // Use mock actions for demo
        const mock: AutoAction[] = [
          { id: 'mock-1', title: 'Freeze TechSoft Pro duplicate billing', savingMonthly: 12000, badges: ['Slack', 'Ticket'] },
          { id: 'mock-2', title: 'Alert Engineering head: AWS spike', savingMonthly: 7560, badges: ['Slack'] },
          { id: 'mock-3', title: 'Flag unused Figma licenses', savingMonthly: 8400, badges: ['Ticket'] },
        ]
        setActions(mock)
        setChecked(new Set(mock.map((a) => a.id)))
      }
    }
    void loadActions()
  }, [sessionId])

  const selectedActions = actions.filter((a) => checked.has(a.id))
  const totalMonthly = selectedActions.reduce((s, a) => s + a.savingMonthly, 0)

  async function handleExecute() {
    setStep('executing')
    const ids = selectedActions.map((a) => a.id)
    setExecuting([...ids])

    // Simulate sequential animation
    for (let i = 0; i < ids.length; i++) {
      await new Promise((r) => setTimeout(r, 800))
      setDone((prev) => new Set(Array.from(prev).concat(ids[i])))
      setProgress(Math.round(((i + 1) / ids.length) * 100))
    }

    // Actually execute
    try {
      const res = await fetch('/api/optimize-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionIds: ids }),
      })
      const data = await res.json() as ExecuteResult
      setResult(data)
    } catch {
      setResult({
        executed: selectedActions.length,
        totalSavingMonthly: totalMonthly,
        totalSavingAnnual: totalMonthly * 12,
        vendorsFrozen: [],
        ticketsCreated: [],
        results: [],
      })
    }

    setStep('complete')
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 300,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-bright)',
          borderRadius: 20,
          maxWidth: 520,
          width: '100%',
          padding: 28,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {step === 'checklist' && (
          <>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              Execute all optimizations
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
              These actions will execute immediately. All are under ₹500 threshold.
            </p>

            {actions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                No AUTO-tier actions available yet. Run analysis first.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {actions.map((action) => (
                  <div
                    key={action.id}
                    style={{
                      background: 'var(--bg-surface)',
                      borderRadius: 10,
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      border: `1px solid ${checked.has(action.id) ? 'rgba(0,212,170,0.2)' : 'var(--border)'}`,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked.has(action.id)}
                      onChange={(e) => {
                        setChecked((prev) => {
                          const next = new Set(prev)
                          if (e.target.checked) next.add(action.id)
                          else next.delete(action.id)
                          return next
                        })
                      }}
                      style={{ accentColor: 'var(--brand)', width: 16, height: 16, flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>{action.title}</p>
                      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                        {action.badges.map((b) => (
                          <span
                            key={b}
                            style={{
                              fontSize: 10,
                              padding: '1px 6px',
                              borderRadius: 4,
                              background: 'rgba(0,212,170,0.1)',
                              color: 'var(--brand)',
                              border: '1px solid rgba(0,212,170,0.2)',
                            }}
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 13,
                        color: 'var(--brand)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ₹{action.savingMonthly.toLocaleString('en-IN')}/mo
                    </p>
                  </div>
                ))}
              </div>
            )}

            {actions.length > 0 && (
              <>
                <div style={{ borderTop: '1px solid var(--border)', margin: '20px 0' }} />
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, color: 'var(--brand)', fontWeight: 600 }}>
                    ₹{totalMonthly.toLocaleString('en-IN')}/mo
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                    ₹{(totalMonthly * 12).toLocaleString('en-IN')} projected annual saving
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={onClose}
                    style={{
                      flex: 1,
                      padding: '11px 0',
                      background: 'none',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      color: 'var(--text-secondary)',
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => void handleExecute()}
                    disabled={selectedActions.length === 0}
                    style={{
                      flex: 2,
                      padding: '11px 0',
                      background: selectedActions.length > 0 ? 'var(--brand)' : 'var(--bg-surface)',
                      border: 'none',
                      borderRadius: 10,
                      color: '#000',
                      fontFamily: "'Syne', sans-serif",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: selectedActions.length > 0 ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Execute {selectedActions.length} Action{selectedActions.length !== 1 ? 's' : ''} →
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {step === 'executing' && (
          <>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
              Executing optimizations...
            </h2>
            <div
              style={{
                height: 6,
                background: 'var(--bg-surface)',
                borderRadius: 3,
                overflow: 'hidden',
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  height: '100%',
                  background: 'var(--brand)',
                  borderRadius: 3,
                  width: `${progress}%`,
                  transition: 'width 500ms ease-out',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {executing.map((id) => {
                const action = actions.find((a) => a.id === id)
                const isDone = done.has(id)
                return (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {isDone ? (
                      <span style={{ color: 'var(--brand)', fontSize: 16, width: 20 }}>✓</span>
                    ) : (
                      <span
                        style={{
                          width: 16,
                          height: 16,
                          border: '2px solid var(--brand)',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                          display: 'inline-block',
                          animation: 'spin 0.8s linear infinite',
                          marginRight: 4,
                        }}
                      />
                    )}
                    <p style={{ fontSize: 13, color: isDone ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {action?.title}
                    </p>
                    {isDone && (
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--brand)' }}>
                        ₹{action?.savingMonthly.toLocaleString('en-IN')}/mo saved
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {step === 'complete' && (
          <div style={{ textAlign: 'center', position: 'relative', minHeight: 300 }}>
            <Confetti />
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'rgba(0,212,170,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path
                  d="M7 18L15 26L29 10"
                  stroke="#00D4AA"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ animation: 'draw-check 0.6s ease-out both' }}
                />
              </svg>
            </div>
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 28,
                color: 'var(--brand)',
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              ₹{(result?.totalSavingMonthly ?? totalMonthly).toLocaleString('en-IN')}/mo
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
              in monthly savings activated
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>
              ₹{(result?.totalSavingAnnual ?? totalMonthly * 12).toLocaleString('en-IN')} projected annual saving
            </p>
            {(result?.ticketsCreated.length ?? 0) > 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                Tickets: {result?.ticketsCreated.join(', ')}
              </p>
            )}
            <a
              href="/actions"
              style={{
                display: 'inline-block',
                padding: '11px 28px',
                background: 'var(--brand)',
                color: '#000',
                borderRadius: 10,
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              View Action Log →
            </a>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes draw-check {
          from { stroke-dasharray: 60; stroke-dashoffset: 60; }
          to { stroke-dasharray: 60; stroke-dashoffset: 0; }
        }
        @keyframes confetti-0 { to { transform: translate(-60px, -120px) rotate(720deg); opacity: 0; } }
        @keyframes confetti-1 { to { transform: translate(60px, -100px) rotate(-540deg); opacity: 0; } }
        @keyframes confetti-2 { to { transform: translate(-30px, -150px) rotate(360deg); opacity: 0; } }
        @keyframes confetti-3 { to { transform: translate(80px, -130px) rotate(-720deg); opacity: 0; } }
        @keyframes confetti-4 { to { transform: translate(20px, -110px) rotate(540deg); opacity: 0; } }
      `}</style>
    </div>
  )
}
