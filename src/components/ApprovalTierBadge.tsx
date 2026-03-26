'use client'

interface ApprovalTierBadgeProps {
  tier: string
}

const TIER_CONFIG: Record<string, { label: string; className: string }> = {
  AUTO:     { label: 'AUTO',           className: 'tier-auto' },
  MANAGER:  { label: 'MANAGER REQ',   className: 'tier-manager' },
  DIRECTOR: { label: 'DIRECTOR REQ',  className: 'tier-director' },
  CFO:      { label: 'CFO REQUIRED',  className: 'tier-cfo' },
}

export default function ApprovalTierBadge({ tier }: ApprovalTierBadgeProps) {
  const config = TIER_CONFIG[tier] ?? TIER_CONFIG['MANAGER']
  return (
    <span
      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${config.className}`}
    >
      {config.label}
    </span>
  )
}
