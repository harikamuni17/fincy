import './globals.css'
import type { Metadata, Viewport } from 'next'
import { ToastProvider } from '@/contexts/ToastContext'
import { CommandPaletteProvider } from '@/contexts/CommandPaletteContext'
import ToastSystem from '@/components/ToastSystem'
import CommandPalette from '@/components/CommandPalette'
import CommandPaletteKeyListener from '@/components/CommandPaletteKeyListener'
import FinciChat from '@/components/FinciChat'
import MobileNav from '@/components/MobileNav'
import DemoKeyListener from '@/components/DemoKeyListener'

export const metadata: Metadata = {
  title: 'Finci — Autonomous AI CFO',
  description: 'Detect, decide, simulate, and prevent financial waste with autonomous AI.',
}

export const viewport: Viewport = {
  themeColor: '#0A0B0E',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=DM+Sans:ital,wght@0,400;0,500;1,400&family=DM+Mono:wght@400;500&family=JetBrains+Mono:wght@400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <ToastProvider>
          <CommandPaletteProvider>
            {children}
            <ToastSystem />
            <CommandPalette />
            <CommandPaletteKeyListener />
            <DemoKeyListener />
            <FinciChat />
          </CommandPaletteProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
