'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import ApprovalTierBadge from '@/components/ApprovalTierBadge'
import { useToast } from '@/hooks/useToast'
import type { ActionLog } from '@/types'

interface ActionCardProps {
  action: ActionLog & {
    finding?: {
      title: string
      severity: string
      affectedVendor?: string | null
      affectedDepartment?: string | null
    }
  }
  onApprove?: (id: string, reasonCode: string, reasonNote: string) => Promise<void>
  onReject?: (id: string, reasonCode: string, reasonNote: string) => Promise<void>
}

const APPROVAL_REASON_CODES = [
  { value: 'APPROVED_SAVINGS_VERIFIED', label: 'Savings verified — proceed' },
]

const REJECTION_REASON_CODES = [
  { value: 'REJECTED_BUDGET_CONSTRAINTS', label: 'Budget constraints' },
  { value: 'REJECTED_VENDOR_CONTRACT', label: 'Vendor contract restriction' },
  { value: 'REJECTED_INSUFFICIENT_EVIDENCE', label: 'Insufficient evidence' },
  { value: 'REJECTED_ESCALATED', label: 'Escalate to next level' },
  { value: 'DELEGATED_TO_DEPARTMENT', label: 'Delegate to department' },
]

export default function ActionCard({ action, onApprove, onReject }: ActionCardProps) {
  const [showForm, setShowForm] = useState<'approve' | 'reject' | null>(null)
  const [reasonCode, setReasonCode] = useState('')
  const [reasonNote, setReasonNote] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // SLA countdown (24h from creation)
  const [slaRemaining, setSlaRemaining] = useState('')
  useEffect(() => {
    const deadline = new Date((action as unknown as { createdAt: string }).createdAt).getTime() + 24 * 60 * 60 * 1000
    const tick = () => {
      const diff = deadline - Date.now()
      if (diff <= 0) { setSlaRemaining('EXPIRED'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setSlaRemaining(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [action])

  const slaIsUrgent = slaRemaining !== 'EXPIRED' && slaRemaining.startsWith('0')
  const isPending = ['PENDING', 'AWAITING_MANAGER', 'AWAITING_DIRECTOR', 'AWAITING_CFO'].includes(action.status)

  async function handleConfirm() {
    if (!reasonCode) return
    setLoading(true)
    try {
      if (showForm === 'approve' && onApprove) {
        await onApprove(action.id, reasonCode, reasonNote)
        toast(`Action approved — ₹${action.estimatedSavingMonthly.toLocaleString('en-IN')}/mo saving activated`, 'success')
      } else if (showForm === 'reject' && onReject) {
        await onReject(action.id, reasonCode, reasonNote)
        toast('Action rejected — reason logged', 'warning')
      }
      setShowForm(null)
    } finally {
      setLoading(false)
    }
  }

  const codes = showForm === 'approve' ? APPROVAL_REASON_CODES : REJECTION_REASON_CODES

  return (
    <div
      className="rounded-xl animate-slide-up"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-bright)',
      }}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <ApprovalTierBadge tier={action.approvalTier} />
          <span
            className="text-xs font-mono px-2 py-0.5 rounded"
            style={{
              background: 'rgba(0,212,170,0.1)',
              color: 'var(--brand)',
            }}
          >
            PRIORITY #{action.priority}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded ml-auto"
            style={{
              background: action.status === 'AUTO_EXECUTED' ? 'rgba(0,212,170,0.1)' :
                          action.status === 'REJECTED'      ? 'rgba(255,77,106,0.1)' :
                          action.status === 'APPROVED'      ? 'rgba(0,212,170,0.1)' :
                          'rgba(255,181,71,0.1)',
              color: action.status === 'AUTO_EXECUTED' || action.status === 'APPROVED' ? 'var(--brand)' :
                     action.status === 'REJECTED' ? 'var(--danger)' : 'var(--warning)',
            }}
          >
            {action.status.replace(/_/g, ' ')}
          </span>
        </div>

        <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          {action.title}
        </h3>

        {action.finding && (
          <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
            {action.finding.affectedDepartment} → {action.finding.affectedVendor ?? 'N/A'} → {action.actionType.replace(/_/g, ' ')}
          </p>
        )}

        {/* Savings row */}
        <div className="flex items-center gap-6 mb-3">
          <div>
            <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>Est. Monthly</p>
            <p className="text-base font-mono font-semibold" style={{ color: 'var(--brand)' }}>
              ₹{action.estimatedSavingMonthly.toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>Annual</p>
            <p className="text-base font-mono font-semibold" style={{ color: 'var(--brand)' }}>
              ₹{action.estimatedSavingAnnual.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="ml-auto">
            <Link
              href={`/simulate?actionId=${action.id}`}
              className="flex items-center gap-1 text-xs"
              style={{ color: 'var(--info)' }}
            >
              <TrendingUp size={12} />
              Simulate First
            </Link>
          </div>
        </div>

        {/* SLA */}
        {isPending && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>SLA:</span>
            <span
              className="text-xs font-mono"
              style={{ color: slaIsUrgent ? 'var(--danger)' : 'var(--text-secondary)' }}
            >
              {slaRemaining} remaining
            </span>
          </div>
        )}

        {/* Approve/Reject buttons */}
        {isPending && !showForm && onApprove && onReject && (
          <div className="flex gap-2">
            <button
              onClick={() => { setShowForm('approve'); setReasonCode('APPROVED_SAVINGS_VERIFIED') }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: 'rgba(0,212,170,0.12)',
                border: '1px solid rgba(0,212,170,0.25)',
                color: 'var(--brand)',
              }}
            >
              <CheckCircle size={13} />
              Approve
            </button>
            <button
              onClick={() => { setShowForm('reject'); setReasonCode('') }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: 'rgba(255,77,106,0.08)',
                border: '1px solid rgba(255,77,106,0.2)',
                color: 'var(--danger)',
              }}
            >
              <XCircle size={13} />
              Reject
            </button>
          </div>
        )}

        {/* Inline form */}
        {showForm && (
          <div
            className="mt-3 p-3 rounded-lg space-y-3"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              {showForm === 'approve' ? 'Approval reason' : 'Rejection reason'}{' '}
              <span style={{ color: 'var(--danger)' }}>*</span>
            </p>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              className="finci-input w-full text-xs"
            >
              <option value="">Select reason code…</option>
              {codes.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <textarea
              placeholder={showForm === 'reject' ? 'Notes (required for rejection)…' : 'Additional notes (optional)…'}
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
              rows={2}
              className="finci-input w-full text-xs resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleConfirm}
                disabled={!reasonCode || (showForm === 'reject' && !reasonNote) || loading}
                className="btn-primary flex-1 text-xs py-1.5"
                style={{ opacity: (!reasonCode || (showForm === 'reject' && !reasonNote)) ? 0.4 : 1 }}
              >
                {loading ? '…' : 'Confirm'}
              </button>
              <button
                onClick={() => setShowForm(null)}
                className="btn-outline flex-1 text-xs py-1.5"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Rejection note */}
        {action.status === 'REJECTED' && action.reasonNote && (
          <div className="mt-3 p-2 rounded" style={{ background: 'rgba(255,77,106,0.06)', border: '1px solid rgba(255,77,106,0.15)' }}>
            <p className="text-xs" style={{ color: 'var(--danger)' }}>
              Rejection note: {action.reasonNote}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
