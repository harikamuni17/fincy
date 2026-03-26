'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useCommandPaletteContext } from '@/contexts/CommandPaletteContext'

interface Command {
  id: string
  label: string
  shortcut: string
  action: () => void
}

export default function CommandPalette() {
  const { isOpen, close } = useCommandPaletteContext()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const commands: Command[] = [
    { id: 'dashboard',  label: 'Go to Dashboard',      shortcut: 'G D', action: () => { router.push('/dashboard'); close() } },
    { id: 'findings',   label: 'Go to Findings',        shortcut: 'G F', action: () => { router.push('/findings'); close() } },
    { id: 'actions',    label: 'Go to Action Center',   shortcut: 'G A', action: () => { router.push('/actions'); close() } },
    { id: 'simulate',   label: 'Open Simulator',        shortcut: 'G S', action: () => { router.push('/simulate'); close() } },
    { id: 'forecast',   label: 'View Forecast',         shortcut: 'G P', action: () => { router.push('/forecast'); close() } },
    { id: 'roi',        label: 'View ROI',              shortcut: 'G R', action: () => { router.push('/roi'); close() } },
    { id: 'upload',     label: 'Upload Data',           shortcut: 'G U', action: () => { router.push('/upload'); close() } },
    { id: 'export',     label: 'Export CFO Report PDF', shortcut: '⌘ E', action: () => { window.open('/api/export/pdf', '_blank'); close() } },
    { id: 'demo',       label: 'Load Demo Data',        shortcut: '⌘ D', action: () => { router.push('/upload'); close() } },
  ]

  const filtered = query
    ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected((s) => Math.min(s + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected((s) => Math.max(s - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        filtered[selected]?.action()
      } else if (e.key === 'Escape') {
        close()
      }
    },
    [filtered, selected, close],
  )

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 80,
        zIndex: 400,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
    >
      <div
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-bright)',
          borderRadius: 16,
          width: 480,
          overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Search input */}
        <div style={{ borderBottom: '1px solid var(--border)', padding: '0 16px' }}>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0) }}
            onKeyDown={handleKeyDown}
            placeholder="Search commands..."
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 15,
              color: 'var(--text-primary)',
              padding: '14px 0',
            }}
          />
        </div>

        {/* Results */}
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <p style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
              No commands found
            </p>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                onClick={cmd.action}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  background: i === selected ? 'var(--bg-surface)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 100ms',
                }}
                onMouseEnter={() => setSelected(i)}
              >
                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{cmd.label}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: "'DM Mono', monospace",
                    color: 'var(--text-muted)',
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border)',
                    padding: '2px 7px',
                    borderRadius: 5,
                  }}
                >
                  {cmd.shortcut}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: '1px solid var(--border)',
            padding: '8px 16px',
            display: 'flex',
            gap: 16,
          }}
        >
          {['↑↓ navigate', '↵ select', 'esc close'].map((hint) => (
            <span key={hint} style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {hint}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
