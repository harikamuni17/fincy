'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import FindingCard from '@/components/cards/FindingCard'
import VendorIntelPanel from '@/components/VendorIntelPanel'
import PeerBenchmark from '@/components/PeerBenchmark'
import type { Finding } from '@/types'

type SeverityFilter = 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
type SortKey = 'waste' | 'severity' | 'confidence'

const SEVERITY_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

export default function FindingsPage() {
  const [findings, setFindings] = useState<Finding[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<SeverityFilter>('ALL')
  const [sortKey, setSortKey] = useState<SortKey>('waste')
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string>('')

  useEffect(() => {
    // Global click handler for data-vendor attributes
    function handleVendorClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      const vendor = target.closest('[data-vendor]')?.getAttribute('data-vendor')
      if (vendor) {
        e.stopPropagation()
        setSelectedVendor(vendor)
      }
    }
    document.addEventListener('click', handleVendorClick)
    return () => document.removeEventListener('click', handleVendorClick)
  }, [])

  useEffect(() => {
    async function loadFindings() {
      setLoading(true)
      try {
        const res = await fetch('/api/findings')
        if (res.ok) {
          const data = await res.json() as { findings: Finding[]; sessionId?: string }
          setFindings(data.findings ?? [])
          if (data.sessionId) setSessionId(data.sessionId)
        }
      } catch {
        // silently fail — show empty state
      } finally {
        setLoading(false)
      }
    }
    void loadFindings()
  }, [])

  const filtered = findings
    .filter((f) => filter === 'ALL' || f.severity === filter)
    .sort((a, b) => {
      if (sortKey === 'waste')      return b.projectedAnnualWaste - a.projectedAnnualWaste
      if (sortKey === 'severity')   return (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4)
      if (sortKey === 'confidence') return b.confidenceScore - a.confidenceScore
      return 0
    })

  const counts = {
    ALL:      findings.length,
    CRITICAL: findings.filter((f) => f.severity === 'CRITICAL').length,
    HIGH:     findings.filter((f) => f.severity === 'HIGH').length,
    MEDIUM:   findings.filter((f) => f.severity === 'MEDIUM').length,
    LOW:      findings.filter((f) => f.severity === 'LOW').length,
  }

  const FILTER_COLORS: Record<string, string> = {
    ALL:      'var(--text-secondary)',
    CRITICAL: 'var(--danger)',
    HIGH:     'var(--warning)',
    MEDIUM:   'var(--info)',
    LOW:      'var(--text-muted)',
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar />
      <main className="ml-[240px] pt-[60px]">
        <TopBar title="Findings" />
        <div className="px-8 py-6">
          {/* Header controls */}
          <div className="flex items-center justify-between mb-6">
            {/* Filter chips */}
            <div className="flex items-center gap-2">
              {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as SeverityFilter[]).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilter(sev)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                  style={{
                    background: filter === sev ? `${FILTER_COLORS[sev]}18` : 'var(--bg-surface)',
                    border: `1px solid ${filter === sev ? FILTER_COLORS[sev] + '44' : 'var(--border)'}`,
                    color: filter === sev ? FILTER_COLORS[sev] : 'var(--text-muted)',
                  }}
                >
                  {sev} {counts[sev] > 0 && <span className="ml-1 opacity-70">{counts[sev]}</span>}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Sort by:</span>
              {(['waste', 'severity', 'confidence'] as SortKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setSortKey(key)}
                  className="px-2.5 py-1 rounded text-xs transition-colors"
                  style={{
                    background: sortKey === key ? 'var(--bg-elevated)' : 'transparent',
                    color: sortKey === key ? 'var(--brand)' : 'var(--text-muted)',
                    border: sortKey === key ? '1px solid var(--border-bright)' : '1px solid transparent',
                  }}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Findings list + benchmark panel */}
          <div className="flex gap-6">
            <div className="flex-1">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-48 rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="rounded-xl p-12 text-center"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <p className="text-2xl mb-2">🔍</p>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                {findings.length === 0 ? 'No findings yet' : 'No findings match this filter'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {findings.length === 0
                  ? 'Load demo data on the Dashboard and run analysis to see findings here.'
                  : 'Try a different severity filter.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((finding) => (
                <FindingCard key={finding.id} finding={finding} />
              ))}
            </div>
          )}
            </div>

            {/* Right sidebar: Peer benchmarks */}
            <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <PeerBenchmark category="Cloud" yourSpend={85000} employeeCount={120} />
              <PeerBenchmark category="SaaS" yourSpend={72000} employeeCount={120} />
              <PeerBenchmark category="Travel" yourSpend={38000} employeeCount={120} />
            </div>
          </div>
        </div>
      </main>

      {selectedVendor && (
        <VendorIntelPanel
          vendorName={selectedVendor}
          sessionId={sessionId}
          onClose={() => setSelectedVendor(null)}
        />
      )}
    </div>
  )
}
