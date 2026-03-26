'use client'

import { useEffect, useState } from 'react'

interface Policy {
  id: string
  name: string
  description: string | null
  condition: string
  field: string
  operator: string
  threshold: number | null
  listValues: string[]
  action: string
  isActive: boolean
  createdAt: string
}

const CONDITIONS = ['SINGLE_TRANSACTION', 'MONTHLY_TOTAL', 'VENDOR_NOT_APPROVED'] as const
const ACTIONS = ['FLAG', 'ALERT', 'BLOCK', 'AUTO_REJECT'] as const
const OPERATORS = ['>', '<', '>=', '<=', '=', 'in'] as const

const ACTION_COLORS: Record<string, string> = {
  FLAG: '#FFB547', ALERT: '#6C8EFF', BLOCK: '#FF8C42', AUTO_REJECT: '#FF4D6A',
}

const CONDITION_LABELS: Record<string, string> = {
  SINGLE_TRANSACTION: 'Single Transaction',
  MONTHLY_TOTAL: 'Monthly Total',
  VENDOR_NOT_APPROVED: 'Vendor Not Approved',
}

export default function PolicyEngine() {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', condition: 'SINGLE_TRANSACTION', field: 'amount', operator: '>', threshold: '', action: 'FLAG' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadPolicies() }, [])

  async function loadPolicies() {
    const res = await fetch('/api/policy')
    if (res.ok) setPolicies(await res.json())
  }

  async function handleCreate() {
    if (!form.name.trim()) return
    setSaving(true)
    await fetch('/api/policy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, threshold: form.threshold ? Number(form.threshold) : undefined }),
    })
    setSaving(false)
    setShowForm(false)
    setForm({ name: '', description: '', condition: 'SINGLE_TRANSACTION', field: 'amount', operator: '>', threshold: '', action: 'FLAG' })
    loadPolicies()
  }

  async function togglePolicy(id: string, isActive: boolean) {
    await fetch('/api/policy', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, isActive: !isActive }) })
    loadPolicies()
  }

  async function deletePolicy(id: string) {
    await fetch('/api/policy', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    loadPolicies()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 10, color: '#4A5065', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>Policy Engine</p>
          <p style={{ fontSize: 20, color: '#F0F2F5', fontWeight: 700 }}>Spend Rules</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#00D4AA', border: 'none', borderRadius: 10, padding: '10px 18px', cursor: 'pointer', color: '#0A0B0E', fontSize: 13, fontWeight: 600 }}
        >
          + Add Rule
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#0D0F14', border: '1px solid rgba(0,212,170,0.3)', borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: '#F0F2F5', fontWeight: 600, marginBottom: 16 }}>New Policy Rule</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              placeholder="Rule name (e.g. Flag large travel expenses)"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={{ background: '#0A0B0E', border: '1px solid #1E2535', borderRadius: 8, padding: '10px 14px', color: '#F0F2F5', fontSize: 13 }}
            />
            <input
              placeholder="Description (optional)"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={{ background: '#0A0B0E', border: '1px solid #1E2535', borderRadius: 8, padding: '10px 14px', color: '#F0F2F5', fontSize: 13 }}
            />
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
                style={{ flex: 1, background: '#0A0B0E', border: '1px solid #1E2535', borderRadius: 8, padding: '10px 12px', color: '#F0F2F5', fontSize: 12 }}>
                {CONDITIONS.map(c => <option key={c} value={c}>{CONDITION_LABELS[c]}</option>)}
              </select>
              <select value={form.operator} onChange={e => setForm(f => ({ ...f, operator: e.target.value }))}
                style={{ width: 80, background: '#0A0B0E', border: '1px solid #1E2535', borderRadius: 8, padding: '10px 12px', color: '#F0F2F5', fontSize: 13 }}>
                {OPERATORS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              <input
                placeholder="Threshold (₹)"
                type="number"
                value={form.threshold}
                onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))}
                style={{ width: 140, background: '#0A0B0E', border: '1px solid #1E2535', borderRadius: 8, padding: '10px 12px', color: '#F0F2F5', fontSize: 13 }}
              />
              <select value={form.action} onChange={e => setForm(f => ({ ...f, action: e.target.value }))}
                style={{ flex: 1, background: '#0A0B0E', border: '1px solid #1E2535', borderRadius: 8, padding: '10px 12px', color: '#F0F2F5', fontSize: 12 }}>
                {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ background: 'transparent', border: '1px solid #1E2535', borderRadius: 8, padding: '8px 16px', color: '#8B92A5', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreate} disabled={saving} style={{ background: '#00D4AA', border: 'none', borderRadius: 8, padding: '8px 18px', color: '#0A0B0E', fontSize: 13, fontWeight: 600, cursor: saving ? 'wait' : 'pointer' }}>
                {saving ? 'Saving…' : 'Create Rule'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {policies.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px', border: '1px dashed #1E2535', borderRadius: 14 }}>
            <p style={{ fontSize: 14, color: '#4A5065' }}>No rules yet. Add your first spend policy.</p>
          </div>
        )}
        {policies.map((p) => (
          <div key={p.id} style={{ background: '#0D0F14', border: '1px solid #1E2535', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, opacity: p.isActive ? 1 : 0.5 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 14, color: '#F0F2F5', fontWeight: 600 }}>{p.name}</span>
                <span style={{ fontSize: 10, color: ACTION_COLORS[p.action] ?? '#8B92A5', background: `${ACTION_COLORS[p.action] ?? '#8B92A5'}15`, padding: '2px 8px', borderRadius: 8, fontFamily: "'DM Mono', monospace" }}>{p.action}</span>
              </div>
              <p style={{ fontSize: 12, color: '#4A5065', fontFamily: "'DM Mono', monospace" }}>
                {CONDITION_LABELS[p.condition]} · {p.field} {p.operator} {p.threshold ? `₹${p.threshold.toLocaleString('en-IN')}` : p.listValues.join(', ')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => togglePolicy(p.id, p.isActive)}
                style={{ background: p.isActive ? 'rgba(0,212,170,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${p.isActive ? '#00D4AA40' : '#1E2535'}`, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: p.isActive ? '#00D4AA' : '#4A5065', fontSize: 12, fontFamily: "'DM Mono', monospace" }}>
                {p.isActive ? 'Active' : 'Paused'}
              </button>
              <button onClick={() => deletePolicy(p.id)}
                style={{ background: 'transparent', border: '1px solid #1E2535', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#FF4D6A', fontSize: 12 }}>
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
