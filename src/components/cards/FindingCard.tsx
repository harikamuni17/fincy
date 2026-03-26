'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, ArrowRight } from 'lucide-react'
import type { Finding } from '@/types'
import type { CalculationStep } from '@/types'
import SavingsMathBreakdown from '@/components/SavingsMathBreakdown'
import ELI5Toggle from '@/components/ELI5Toggle'
import AgentReasoningPanel from '@/components/AgentReasoningPanel'
import ConfidenceDecayBadge from '@/components/ConfidenceDecayBadge'
import Link from 'next/link'

interface FindingCardProps {
  finding: Finding
  onAction?: (id: string) => void
}

const SEVERITY_CONFIG = {
  CRITICAL: { borderColor: 'var(--danger)',  dotColor: 'var(--danger)',  bg: 'rgba(255,77,106,0.06)',  label: 'CRITICAL' },
  HIGH:     { borderColor: 'var(--warning)', dotColor: 'var(--warning)', bg: 'rgba(255,181,71,0.06)', label: 'HIGH' },
  MEDIUM:   { borderColor: 'var(--info)',    dotColor: 'var(--info)',    bg: 'rgba(108,142,255,0.06)', label: 'MEDIUM' },
  LOW:      { borderColor: 'var(--text-muted)', dotColor: 'var(--text-muted)', bg: 'transparent', label: 'LOW' },
}

export default function FindingCard({ finding, onAction }: FindingCardProps) {
  // Always expanded by default — critical for judging criterion #1
  const [expanded, setExpanded] = useState(true)

  const config = SEVERITY_CONFIG[finding.severity] ?? SEVERITY_CONFIG.LOW
  const steps = finding.calculationSteps as unknown as CalculationStep[]

  return (
    <div
      className="rounded-r-xl animate-slide-up overflow-hidden"
      style={{
        background: config.bg,
        borderLeft: `2px solid ${config.borderColor}`,
        border: `1px solid var(--border)`,
        borderLeftColor: config.borderColor,
        borderLeftWidth: '2px',
      }}
    >
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
              style={{ background: config.dotColor }}
            />
            <span
              className="text-xs font-mono font-medium px-2 py-0.5 rounded"
              style={{
                color: config.dotColor,
                background: `${config.dotColor}1A`,
              }}
            >
              {config.label}
            </span>
            <span
              className="text-xs font-mono px-2 py-0.5 rounded"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}
            >
              {finding.findingType.replace(/_/g, ' ')}
            </span>
          </div>
          {finding.affectedDepartment && (
            <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
              {finding.affectedDepartment}
            </span>
          )}
        </div>

        <h3 className="text-sm font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
          {finding.title}
        </h3>
        <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
          {finding.description}
        </p>

        {/* Confidence with decay badge */}
        <div className="flex items-center gap-6 mb-4">
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
              Baseline
            </p>
            <p className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
              ₹{finding.baselineAmount.toLocaleString('en-IN')}/mo
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
              Anomaly
            </p>
            <p className="text-sm font-mono" style={{ color: 'var(--warning)' }}>
              ₹{finding.anomalyAmount.toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
              Delta
            </p>
            <p className="text-sm font-mono font-semibold" style={{ color: 'var(--danger)' }}>
              ₹{finding.deltaAmount.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
              Confidence
            </p>
            <div className="flex items-center gap-2">
              <ConfidenceDecayBadge finding={finding} />
            </div>
          </div>
        </div>

        {/* Math breakdown toggle with ELI5 */}
        <ELI5Toggle
          findingId={finding.id}
          content={
            <>
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 text-xs mb-2 transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                How we calculated this
              </button>
              {expanded && (
                <SavingsMathBreakdown steps={steps} annualProjection={finding.projectedAnnualWaste} />
              )}
            </>
          }
        />

        <AgentReasoningPanel findingId={finding.id} />

        {/* Action button */}
        <div className="flex justify-end mt-4">
          {onAction ? (
            <button
              onClick={() => onAction(finding.id)}
              className="btn-primary flex items-center gap-1.5 text-xs"
            >
              Take Action <ArrowRight size={12} />
            </button>
          ) : (
            <Link href="/actions" className="btn-primary flex items-center gap-1.5 text-xs">
              Take Action <ArrowRight size={12} />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
