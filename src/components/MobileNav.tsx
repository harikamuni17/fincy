'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/findings', label: 'Findings', icon: '◎' },
  { href: '/actions', label: 'Actions', icon: '◈' },
  { href: '/simulate', label: 'Simulate', icon: '◑' },
  { href: '/forecast', label: 'Forecast', icon: '▲' },
  { href: '/roi', label: 'ROI', icon: '◢' },
  { href: '/policies', label: 'Policies', icon: '⊕' },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: '#0D0F14', borderTop: '1px solid #1E2535', display: 'flex', alignItems: 'center', padding: '0 4px' }}
      className="md:hidden"
    >
      {NAV.map((item) => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 2px', textDecoration: 'none', color: active ? '#00D4AA' : '#4A5065', minWidth: 0 }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
            <span style={{ fontSize: 9, marginTop: 3, fontFamily: "'DM Mono', monospace", letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
