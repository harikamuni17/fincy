'use client'

import { useEffect, useRef, useState } from 'react'
import { useToast } from '@/hooks/useToast'
import type { Toast } from '@/contexts/ToastContext'

const TYPE_COLORS: Record<Toast['type'], string> = {
  success: '#00D4AA',
  error:   '#FF4D6A',
  info:    '#6C8EFF',
  warning: '#FFB547',
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    // Trigger enter animation
    const id = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(id)
  }, [])

  function handleDismiss() {
    setExiting(true)
    setTimeout(() => onDismiss(toast.id), 150)
  }

  const color = TYPE_COLORS[toast.type]

  return (
    <div
      style={{
        transform: visible && !exiting ? 'translateY(0)' : exiting ? 'translateX(-20px)' : 'translateY(8px)',
        opacity: visible && !exiting ? 1 : 0,
        transition: exiting
          ? 'transform 150ms ease-in, opacity 150ms ease-in'
          : 'transform 200ms ease-out, opacity 200ms ease-out',
        background: 'var(--bg-elevated)',
        borderLeft: `2px solid ${color}`,
        borderRadius: '10px',
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '320px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Colored dot */}
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
        }}
      />
      {/* Message */}
      <span
        style={{
          flex: 1,
          fontSize: 13,
          color: 'var(--text-primary)',
          lineHeight: 1.4,
        }}
      >
        {toast.message}
      </span>
      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0 2px',
          flexShrink: 0,
        }}
        aria-label="Dismiss"
      >
        ×
      </button>
      {/* Progress bar */}
      <ProgressBar duration={toast.duration} color={color} onComplete={handleDismiss} />
    </div>
  )
}

function ProgressBar({
  duration,
  color,
  onComplete,
}: {
  duration: number
  color: string
  onComplete: () => void
}) {
  const [width, setWidth] = useState(100)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const animate = (ts: number) => {
      if (startRef.current === null) startRef.current = ts
      const elapsed = ts - startRef.current
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setWidth(remaining)
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        onComplete()
      }
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration])

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: 3,
        width: `${width}%`,
        background: color,
        opacity: 0.5,
        transition: 'width 100ms linear',
      }}
    />
  )
}

export default function ToastSystem() {
  const { toasts, dismiss } = useToast()

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '8px',
        maxWidth: '320px',
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>
  )
}
