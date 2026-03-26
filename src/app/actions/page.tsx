'use client'

import { useState, useEffect, useCallback } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import ActionCard from '@/components/cards/ActionCard'
import ApprovalTierBadge from '@/components/ApprovalTierBadge'
import { format } from 'date-fns'
import type { ActionLog } from '@/types'

type TierFilter = 'ALL' | 'AUTO' | 'MANAGER' | 'DIRECTOR' | 'CFO'

interface ActionWithFinding extends ActionLog {
  finding: {
    id: string
    title: string
    severity: string
    affectedVendor: string | null
    affectedDepartment: string | null
    deltaAmount: number
    projectedAnnualWaste: number
  }
  approvedBy?: { name: string; email: string } | null
}

interface ActivityEntry {
  id: string
  ts: string
  label: string
  status: string
  reasonCode?: string | null
  approvedBy?: { name: string } | null
}

export default function ActionsPage() {
  const [actions, setActions] = useState<ActionWithFinding[]>([])
  const [loading, setLoading] = useState(true)
  const [tierFilter, setTierFilter] = useState<TierFilter>('ALL')

  const loadActions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/actions')
      if (res.ok) {
        const data = await res.json() as { actions: ActionWithFinding[] }
        setActions(data.actions ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadActions() }, [loadActions])

  async function handleApprove(id: string, reasonCode: string, reasonNote: string) {
    const res = await fetch(`/api/actions/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reasonCode, reasonNote }),
    })
    if (res.ok) await loadActions()
  }

  async function handleReject(id: string, reasonCode: string, reasonNote: string) {
    const res = await fetch(`/api/actions/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reasonCode, reasonNote }),
    })
    if (res.ok) await loadActions()
  }

  const filtered = actions.filter((a) =>
    tierFilter === 'ALL' ? true : a.approvalTier === tierFilter,
  )

  const pending  = filtered.filter((a) => ['PENDING', 'AWAITING_MANAGER', 'AWAITING_DIRECTOR', 'AWAITING_CFO'].includes(a.status))
  const activity = actions.slice(0, 20) as (ActionWithFinding & { createdAt: string })[]

  const TIER_CAPS: Record<string, number> = {
    ALL:      actions.length,
    AUTO:     actions.filter((a) => a.approvalTier === 'AUTO').length,
    MANAGER:  actions.filter((a) => a.approvalTier === 'MANAGER').length,
    DIRECTOR: actions.filter((a) => a.approvalTier === 'DIRECTOR').length,
    CFO:      actions.filter((a) => a.approvalTier === 'CFO').length,
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar />
      <main className="ml-[240px] pt-[60px]">
        <TopBar title="Approval Center" />
        <div className="px-8 py-6">
          {/* Filter tabs */}
          <div className="flex items-center gap-2 mb-6">
            {(['ALL', 'AUTO', 'MANAGER', 'DIRECTOR', 'CFO'] as TierFilter[]).map((t) => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
                style={{
                  background: tierFilter === t ? 'var(--bg-elevated)' : 'var(--bg-surface)',
                  border: `1px solid ${tierFilter === t ? 'var(--border-bright)' : 'var(--border)'}`,
                  color: tierFilter === t ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                {t !== 'ALL' && <ApprovalTierBadge tier={t} />}
                {t === 'ALL' && 'ALL'}
                <span style={{ color: 'var(--text-muted)' }}>{TIER_CAPS[t]}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-5 gap-6">
            {/* LEFT: pending actions (60%) */}
            <div className="col-span-3 space-y-4">
              <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--text-secondary)' }}>
                Pending Approval ({pending.length})
              </p>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => <div key={i} className="skeleton h-48 rounded-xl" />)}
                </div>
              ) : pending.length === 0 ? (
                <div className="rounded-xl p-10 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <p className="text-2xl mb-2">✓</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No pending approvals</p>
                </div>
              ) : (
                pending.map((action) => (
                  <ActionCard
                    key={action.id}
                    action={action}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))
              )}
            </div>

            {/* RIGHT: activity log (40%) */}
            <div className="col-span-2">
              <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--text-secondary)' }}>
                Activity Log
              </p>
              <div
                className="rounded-xl overflow-hidden"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              >
                {activity.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No activity yet</p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {activity.map((a) => (
                      <div key={a.id} className="px-4 py-3 flex items-start gap-3">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                          style={{
                            background:
                              a.status === 'AUTO_EXECUTED' || a.status === 'APPROVED' ? 'var(--brand)' :
                              a.status === 'REJECTED' ? 'var(--danger)' :
                              'var(--warning)',
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                            {a.status === 'AUTO_EXECUTED' ? 'AUTO EXECUTED' :
                             a.status === 'APPROVED'      ? 'APPROVED' :
                             a.status === 'REJECTED'      ? 'REJECTED' :
                             a.status.replace(/_/g, ' ')}
                            : {a.title.substring(0, 40)}
                          </p>
                          {a.approvedBy && (
                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                              by {a.approvedBy.name}
                            </p>
                          )}
                          {a.reasonCode && (
                            <span
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded mt-1 inline-block"
                              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                            >
                              {a.reasonCode.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                          {format(new Date(a.createdAt), 'HH:mm')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
