'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import ScenarioSimulator from '@/components/ScenarioSimulator'
import CompoundCalculator from '@/components/CompoundCalculator'
import type { ActionLog } from '@/types'

interface ActionOption extends ActionLog {
  finding: { title: string; affectedVendor: string | null; affectedDepartment: string | null }
}

export default function SimulatePage() {
  const searchParams = useSearchParams()
  const initialActionId = searchParams.get('actionId')

  const [actions, setActions] = useState<ActionOption[]>([])
  const [selectedActionId, setSelectedActionId] = useState<string>(initialActionId ?? '')
  const [loading, setLoading] = useState(true)

  const loadActions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/actions')
      if (res.ok) {
        const data = await res.json() as { actions: ActionOption[] }
        const acts = data.actions ?? []
        setActions(acts)
        if (!selectedActionId && acts.length > 0) {
          setSelectedActionId(acts[0].id)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [selectedActionId])

  useEffect(() => { void loadActions() }, [loadActions])

  const selectedAction = actions.find((a) => a.id === selectedActionId)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar />
      <main className="ml-[240px] pt-[60px]">
        <TopBar title="Scenario Simulator" />
        <div className="px-8 py-6">
          <div className="mb-6">
            <h2 className="font-display text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              What happens if you act?
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Model the financial impact of each action before approving. Review the projected savings and execution impact.
            </p>
          </div>

          {/* Action selector */}
          <div className="mb-6">
            <label className="text-xs uppercase tracking-widest mb-2 block" style={{ color: 'var(--text-muted)' }}>
              Select action to simulate
            </label>
            {loading ? (
              <div className="skeleton h-10 w-96 rounded-lg" />
            ) : actions.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No actions yet — load demo data first.</p>
            ) : (
              <select
                value={selectedActionId}
                onChange={(e) => setSelectedActionId(e.target.value)}
                className="finci-input w-full max-w-xl"
              >
                {actions.map((a) => (
                  <option key={a.id} value={a.id}>
                    #{a.priority} — {a.title.substring(0, 70)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedAction && (
            <div>
              {/* Action summary */}
              <div
                className="rounded-xl p-4 mb-6 flex items-start gap-6"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              >
                <div>
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Action</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{selectedAction.title}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Monthly Saving</p>
                  <p className="text-lg font-mono font-semibold" style={{ color: 'var(--brand)' }}>
                    ₹{selectedAction.estimatedSavingMonthly.toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Annual Saving</p>
                  <p className="text-lg font-mono font-semibold" style={{ color: 'var(--brand)' }}>
                    ₹{selectedAction.estimatedSavingAnnual.toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Tier</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selectedAction.approvalTier}</p>
                </div>
              </div>

              <ScenarioSimulator
                actionLogId={selectedAction.id}
                initialSaving12m={selectedAction.estimatedSavingAnnual}
                initialSaving3m={selectedAction.estimatedSavingMonthly * 3}
              />

              <div style={{ marginTop: 32 }}>
                <CompoundCalculator annualSaving={selectedAction.estimatedSavingAnnual} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
