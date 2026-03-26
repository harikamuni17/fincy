'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration: number
  createdAt: number
}

interface ToastContextValue {
  toast: (message: string, type: Toast['type'], duration?: number) => void
  toasts: Toast[]
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
  toasts: [],
  dismiss: () => {},
})

function nanoid6(): string {
  return Math.random().toString(36).substring(2, 8)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const toast = useCallback(
    (message: string, type: Toast['type'], duration = 4000) => {
      const id = nanoid6()
      const newToast: Toast = { id, message, type, duration, createdAt: Date.now() }

      setToasts((prev) => {
        const next = [...prev, newToast]
        // Max 4 toasts visible — drop oldest if needed
        if (next.length > 4) {
          const removed = next.shift()!
          const timer = timersRef.current.get(removed.id)
          if (timer) {
            clearTimeout(timer)
            timersRef.current.delete(removed.id)
          }
        }
        return next
      })

      const timer = setTimeout(() => dismiss(id), duration)
      timersRef.current.set(id, timer)
    },
    [dismiss],
  )

  // Cleanup on unmount
  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((t) => clearTimeout(t))
    }
  }, [])

  return <ToastContext.Provider value={{ toast, toasts, dismiss }}>{children}</ToastContext.Provider>
}

export { ToastContext }
export default ToastContext
