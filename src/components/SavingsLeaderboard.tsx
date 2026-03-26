'use client'

import type { ActionLog } from '@/types'

interface SavingsLeaderboardProps {
  actionLogs: ActionLog[]
}

interface LeaderEntry {
  name: string
  savingMonthly: number
  rank: number
}

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32']

export default function SavingsLeaderboard({ actionLogs }: SavingsLeaderboardProps) {
  const leaderboard: LeaderEntry[] = (() => {
    const map = new Map<string, number>()
    for (const log of actionLogs) {
      if (!['APPROVED', 'AUTO_EXECUTED', 'EXECUTED'].includes(log.status)) continue
      const approver = (log as unknown as { approvedBy?: { name?: string } }).approvedBy?.name
      const name = approver ?? 'System'
      map.set(name, (map.get(name) ?? 0) + log.estimatedSavingMonthly)
    }
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, saving], i) => ({ name, savingMonthly: saving, rank: i + 1 }))
  })()

  const maxSaving = leaderboard[0]?.savingMonthly ?? 1

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 24,
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--text-secondary)',
          marginBottom: 16,
        }}
      >
        Cost Optimization Champions
      </p>

      {leaderboard.length === 0 ? (
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            textAlign: 'center',
            padding: '16px 0',
          }}
        >
          Approve actions to appear on the leaderboard
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {leaderboard.map((entry) => {
            const medalColor = MEDAL_COLORS[entry.rank - 1]
            const barWidth = (entry.savingMonthly / maxSaving) * 100

            return (
              <div key={entry.name}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Medal circle */}
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: medalColor ?? 'var(--bg-elevated)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#000',
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      {entry.rank}
                    </span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.name}
                    </p>
                  </div>

                  <p
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 13,
                      color: 'var(--brand)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    ₹{entry.savingMonthly.toLocaleString('en-IN')}/mo
                  </p>
                </div>

                {/* Progress bar */}
                <div
                  style={{
                    marginTop: 5,
                    marginLeft: 32,
                    height: 3,
                    background: 'var(--bg-elevated)',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${barWidth}%`,
                      background: medalColor ?? 'var(--brand)',
                      borderRadius: 2,
                      transition: 'width 600ms ease-out',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
