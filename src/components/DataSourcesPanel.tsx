'use client'

import { Upload, FileText, CreditCard, CheckCircle } from 'lucide-react'

interface DataSource {
  id: string
  name: string
  icon: typeof Upload
  status: 'connected' | 'available'
  description: string
  records?: number
}

interface DataSourcesPanelProps {
  connectedSources?: string[]
  totalRecords?: number
}

const SOURCES: DataSource[] = [
  { id: 'csv',       name: 'CSV Upload',         icon: Upload,     status: 'available', description: 'Expense reports, AP ledgers' },
  { id: 'pdf',       name: 'Bank Statement PDF',  icon: FileText,   status: 'available', description: 'Statement parsing + OCR' },
  { id: 'card-feed', name: 'Corporate Card Feed', icon: CreditCard, status: 'available', description: 'Live corporate card transactions' },
]

export default function DataSourcesPanel({ connectedSources = [], totalRecords = 0 }: DataSourcesPanelProps) {
  return (
    <div
      className="rounded-xl p-5 h-full"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--text-secondary)' }}>
        Data Sources
      </p>
      <div className="space-y-2.5">
        {SOURCES.map((src) => {
          const isConnected = connectedSources.includes(src.id)
          const Icon = src.icon
          return (
            <div
              key={src.id}
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{
                background: isConnected ? 'rgba(0,212,170,0.06)' : 'var(--bg-elevated)',
                border: `1px solid ${isConnected ? 'rgba(0,212,170,0.2)' : 'var(--border)'}`,
              }}
            >
              <Icon
                size={14}
                style={{ color: isConnected ? 'var(--brand)' : 'var(--text-muted)', flexShrink: 0 }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  {src.name}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {isConnected ? `${totalRecords.toLocaleString('en-IN')} records` : src.description}
                </p>
              </div>
              {isConnected ? (
                <CheckCircle size={12} style={{ color: 'var(--brand)', flexShrink: 0 }} />
              ) : (
                <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  Available
                </span>
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          3 data source types · Real-time card feed enabled
        </p>
      </div>
    </div>
  )
}
