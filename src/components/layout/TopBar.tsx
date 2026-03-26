'use client'

import { Bell, Download, Database } from 'lucide-react'

interface TopBarProps {
  title: string
  sessionStatus?: 'PENDING' | 'ANALYZING' | 'COMPLETE' | 'FAILED' | null
  sessionId?: string | null
  pendingCount?: number
  onLoadDemo?: () => void
  onExportPDF?: () => void
}

export default function TopBar({
  title,
  sessionStatus,
  sessionId,
  pendingCount = 0,
  onLoadDemo,
  onExportPDF,
}: TopBarProps) {
  const handleExport = () => {
    if (onExportPDF) { onExportPDF(); return }
    if (!sessionId) return
    window.open(`/api/export/pdf?sessionId=${sessionId}`, '_blank')
  }

  return (
    <header
      className="fixed top-0 left-[240px] right-0 h-[60px] flex items-center justify-between px-8 z-30"
      style={{
        background: 'var(--bg-base)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Left: page title */}
      <h1
        className="text-sm font-display font-semibold tracking-wide"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h1>

      {/* Right: controls */}
      <div className="flex items-center gap-3">
        {/* Session status chip */}
        {sessionStatus && (
          <span
            className="px-2.5 py-1 rounded-full text-xs font-medium font-mono"
            style={{
              background:
                sessionStatus === 'COMPLETE'  ? 'rgba(0,212,170,0.12)' :
                sessionStatus === 'ANALYZING' ? 'rgba(255,181,71,0.12)' :
                sessionStatus === 'FAILED'    ? 'rgba(255,77,106,0.12)' :
                'var(--bg-elevated)',
              color:
                sessionStatus === 'COMPLETE'  ? 'var(--brand)' :
                sessionStatus === 'ANALYZING' ? 'var(--warning)' :
                sessionStatus === 'FAILED'    ? 'var(--danger)' :
                'var(--text-muted)',
            }}
          >
            {sessionStatus === 'ANALYZING' && (
              <span className="mr-1 inline-block animate-spin">⟳</span>
            )}
            {sessionStatus === 'COMPLETE' ? '● Complete' :
             sessionStatus === 'ANALYZING' ? 'Analyzing...' :
             sessionStatus === 'FAILED' ? '✕ Failed' :
             '○ No Data'}
          </span>
        )}

        {/* Load Demo Data */}
        <button
          onClick={onLoadDemo}
          className="btn-outline flex items-center gap-1.5"
          style={{ fontSize: '12px', padding: '6px 12px' }}
        >
          <Database size={13} />
          Load Demo Data
        </button>

        {/* Export PDF */}
        <button
          onClick={handleExport}
          disabled={!sessionId}
          className="btn-primary flex items-center gap-1.5"
          style={{
            fontSize: '12px',
            padding: '6px 12px',
            opacity: sessionId ? 1 : 0.4,
            cursor: sessionId ? 'pointer' : 'not-allowed',
          }}
        >
          <Download size={13} />
          Export PDF
        </button>

        {/* Notification bell */}
        <button
          className="relative p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Bell size={16} />
          {pendingCount > 0 && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono font-bold"
              style={{ background: 'var(--danger)', color: 'white' }}
            >
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
