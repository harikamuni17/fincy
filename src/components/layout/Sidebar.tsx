'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, AlertTriangle, Zap, TrendingUp, BarChart3,
  DollarSign, Activity, ShieldCheck, ArrowLeftRight,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard',  label: 'Dashboard',   icon: LayoutDashboard, shortcut: '⌘1' },
  { href: '/findings',   label: 'Findings',    icon: AlertTriangle,   shortcut: '⌘2' },
  { href: '/actions',    label: 'Actions',     icon: Zap,             shortcut: '⌘3' },
  { href: '/simulate',   label: 'Simulate',    icon: TrendingUp,      shortcut: '⌘4' },
  { href: '/forecast',   label: 'Forecast',    icon: BarChart3,       shortcut: '⌘5' },
  { href: '/roi',        label: 'ROI Tracker', icon: DollarSign,      shortcut: '⌘6' },
  { href: '/policies',   label: 'Policies',    icon: ShieldCheck,     shortcut: '⌘7' },
  { href: '/compare',    label: 'Compare',     icon: ArrowLeftRight,  shortcut: '⌘8' },
]

interface SidebarProps {
  sessionStatus?: 'PENDING' | 'ANALYZING' | 'COMPLETE' | 'FAILED' | null
}

export default function Sidebar({ sessionStatus }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}
      className="fixed left-0 top-0 h-full w-[240px] hidden md:flex flex-col z-40"
    >
      {/* Brand */}
      <div className="px-6 pt-7 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-xl font-medium" style={{ color: 'var(--brand)' }}>fi</span>
          <span className="font-mono text-xl font-medium" style={{ color: 'var(--text-primary)' }}>nci</span>
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Autonomous AI CFO</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200"
              style={{
                background: isActive ? 'var(--bg-subtle)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--brand)' : '2px solid transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              <div className="flex items-center gap-3">
                <Icon
                  size={15}
                  style={{ color: isActive ? 'var(--brand)' : 'var(--text-muted)' }}
                />
                <span className="font-medium">{item.label}</span>
              </div>
              <span
                className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}
              >
                {item.shortcut}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Session status */}
      <div
        className="px-5 py-4 mx-3 mb-4 rounded-xl"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Activity size={12} style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Session
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              background:
                sessionStatus === 'COMPLETE' ? 'var(--brand)' :
                sessionStatus === 'ANALYZING' ? 'var(--warning)' :
                sessionStatus === 'FAILED' ? 'var(--danger)' :
                'var(--text-muted)',
            }}
          />
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {sessionStatus === 'COMPLETE' ? 'Analysis complete' :
             sessionStatus === 'ANALYZING' ? 'Analyzing...' :
             sessionStatus === 'FAILED' ? 'Analysis failed' :
             'No data loaded'}
          </span>
        </div>
      </div>
    </aside>
  )
}
