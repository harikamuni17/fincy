'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  leftLabel?: string
  leftChildren: React.ReactNode
  rightLabel?: string
  rightChildren: React.ReactNode
  leftColor?: string
  rightColor?: string
}

export default function BeforeAfterSlider({
  leftLabel = 'Before',
  leftChildren,
  rightLabel = 'After',
  rightChildren,
  leftColor = '#FF4D6A',
  rightColor = '#00D4AA',
}: Props) {
  const [pos, setPos] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  function getPosPct(clientX: number) {
    const el = containerRef.current
    if (!el) return 50
    const rect = el.getBoundingClientRect()
    return Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))
  }

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      setPos(getPosPct(clientX))
    }
    const onUp = () => { dragging.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove)
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: 320, overflow: 'hidden', borderRadius: 14, cursor: 'col-resize', userSelect: 'none', border: '1px solid #1E2535' }}>
      {/* LEFT PANEL */}
      <div style={{ position: 'absolute', inset: 0, background: '#0D0F14', display: 'flex', flexDirection: 'column', padding: 24 }}>
        <span style={{ fontSize: 10, color: leftColor, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>{leftLabel}</span>
        <div style={{ flex: 1, overflow: 'hidden' }}>{leftChildren}</div>
      </div>

      {/* RIGHT PANEL — clipped */}
      <div style={{ position: 'absolute', inset: 0, background: '#0D0F14', display: 'flex', flexDirection: 'column', padding: 24, clipPath: `inset(0 0 0 ${pos}%)` }}>
        <span style={{ fontSize: 10, color: rightColor, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: "'DM Mono', monospace", marginBottom: 8 }}>{rightLabel}</span>
        <div style={{ flex: 1, overflow: 'hidden' }}>{rightChildren}</div>
      </div>

      {/* DIVIDER */}
      <div
        onMouseDown={() => { dragging.current = true }}
        onTouchStart={() => { dragging.current = true }}
        style={{ position: 'absolute', top: 0, bottom: 0, left: `${pos}%`, width: 2, background: '#F0F2F5', transform: 'translateX(-50%)', cursor: 'col-resize', zIndex: 10 }}
      >
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 28, height: 28, borderRadius: '50%', background: '#F0F2F5', boxShadow: '0 2px 12px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M4 7L1 4M4 7L1 10M10 7L13 4M10 7L13 10" stroke="#0A0B0E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="7" y1="2" x2="7" y2="12" stroke="#0A0B0E" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Labels at edges */}
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 5, pointerEvents: 'none' }}>
        <span style={{ fontSize: 10, color: leftColor, fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em', background: '#0A0B0E', padding: '2px 6px', borderRadius: 4 }}>{leftLabel}</span>
      </div>
      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 5, pointerEvents: 'none' }}>
        <span style={{ fontSize: 10, color: rightColor, fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em', background: '#0A0B0E', padding: '2px 6px', borderRadius: 4 }}>{rightLabel}</span>
      </div>
    </div>
  )
}
