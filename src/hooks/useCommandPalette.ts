'use client'

import { useEffect } from 'react'
import { useCommandPaletteContext } from '@/contexts/CommandPaletteContext'

export function useCommandPalette() {
  const ctx = useCommandPaletteContext()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName.toLowerCase()
      const isEditable = tag === 'input' || tag === 'textarea' || (e.target as HTMLElement).isContentEditable

      if (e.key === '?' && !isEditable && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        ctx.open()
        return
      }

      if (e.key === 'Escape' && ctx.isOpen) {
        e.preventDefault()
        ctx.close()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [ctx])

  return ctx
}
