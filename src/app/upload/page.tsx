'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import OnboardingEmptyState from '@/components/OnboardingEmptyState'
import { Upload, FileText, CreditCard, Check, Loader2 } from 'lucide-react'

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

interface UploadResult {
  sessionId: string
  recordCount: number
  totalSpend: number
  sourceType: string
}

export default function UploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<'csv' | 'pdf' | 'card-feed'>('card-feed')

  async function handleLoadCardFeed() {
    setUploadStatus('uploading')
    setError(null)
    try {
      const res = await fetch('/api/ingest/card-feed', { method: 'POST' })
      const data = await res.json() as UploadResult & { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to load card feed')
      setUploadResult(data)
      setUploadStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setUploadStatus('error')
    }
  }

  async function handleFileUpload(file: File) {
    setUploadStatus('uploading')
    setError(null)
    const formData = new FormData()
    formData.append('file', file)
    const endpoint = file.name.endsWith('.pdf') ? '/api/ingest/pdf' : '/api/ingest/csv'
    try {
      const res = await fetch(endpoint, { method: 'POST', body: formData })
      const data = await res.json() as UploadResult & { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      setUploadResult(data)
      setUploadStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
      setUploadStatus('error')
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) void handleFileUpload(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void handleFileUpload(file)
  }

  const sources = [
    { id: 'card-feed' as const, icon: CreditCard, label: 'Corporate Card Feed', description: '200 realistic transactions with injected anomalies. Best for demo.', badge: 'RECOMMENDED' },
    { id: 'csv' as const, icon: Upload, label: 'CSV Upload', description: 'Upload expense reports, AP ledgers, or any transaction CSV.' },
    { id: 'pdf' as const, icon: FileText, label: 'Bank Statement PDF', description: 'Upload a bank statement PDF for OCR-based extraction.' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar />
      <main className="ml-[240px] pt-[60px]">
        <TopBar title="Data Sources" />
        {uploadStatus === 'idle' && !uploadResult ? (
          <>
            <OnboardingEmptyState
              onLoadDemo={() => void handleLoadCardFeed()}
              onUpload={() => fileInputRef.current?.click()}
            />
            <input ref={fileInputRef} type="file" accept=".csv,.pdf" className="hidden" onChange={handleFileChange} />
          </>
        ) : (
        <div className="px-8 py-8 max-w-3xl">
          <h2 className="font-display text-2xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Connect your financial data
          </h2>
          <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
            Finci analyzes multiple data sources simultaneously for deeper insights.
          </p>

          {/* Source selector */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {sources.map((src) => {
              const Icon = src.icon
              return (
                <button
                  key={src.id}
                  onClick={() => setSelectedType(src.id)}
                  className="p-4 rounded-xl text-left transition-all duration-200"
                  style={{
                    background: selectedType === src.id ? 'rgba(0,212,170,0.08)' : 'var(--bg-surface)',
                    border: `1px solid ${selectedType === src.id ? 'rgba(0,212,170,0.4)' : 'var(--border)'}`,
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <Icon size={18} style={{ color: selectedType === src.id ? 'var(--brand)' : 'var(--text-muted)' }} />
                    {src.badge && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,212,170,0.15)', color: 'var(--brand)' }}>
                        {src.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{src.label}</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{src.description}</p>
                </button>
              )
            })}
          </div>

          {/* Action area */}
          {selectedType === 'card-feed' ? (
            <div
              className="rounded-xl p-8 text-center"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <CreditCard size={32} className="mx-auto mb-4" style={{ color: 'var(--brand)' }} />
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Load Demo Card Feed</h3>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Generates 200 realistic corporate card transactions with 4 injected anomalies:<br />
                AWS spike (2.8×), duplicate billing, travel overrun, and unused licenses.
              </p>
              <button onClick={() => void handleLoadCardFeed()} className="btn-primary" disabled={uploadStatus === 'uploading'}>
                {uploadStatus === 'uploading' ? (
                  <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading...</span>
                ) : 'Load Demo Card Feed'}
              </button>
            </div>
          ) : (
            <div
              onDragEnter={() => setDragActive(true)}
              onDragLeave={() => setDragActive(false)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl p-12 text-center cursor-pointer transition-all duration-200"
              style={{
                background: dragActive ? 'rgba(0,212,170,0.06)' : 'var(--bg-surface)',
                border: `2px dashed ${dragActive ? 'var(--brand)' : 'var(--border)'}`,
              }}
            >
              <Upload size={32} className="mx-auto mb-4" style={{ color: dragActive ? 'var(--brand)' : 'var(--text-muted)' }} />
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                Drop your {selectedType === 'csv' ? 'CSV' : 'PDF'} here or click to browse
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {selectedType === 'csv' ? 'Supports: .csv | columns: date, vendor, amount, category, department' : 'Supports: .pdf | bank statements, AP reports'}
              </p>
              <input ref={fileInputRef} type="file" accept={selectedType === 'csv' ? '.csv' : '.pdf'} className="hidden" onChange={handleFileChange} />
            </div>
          )}

          {/* Status */}
          {uploadStatus === 'success' && uploadResult && (
            <div className="mt-6 p-5 rounded-xl animate-slide-up" style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.25)' }}>
              <div className="flex items-center gap-2 mb-3">
                <Check size={16} style={{ color: 'var(--brand)' }} />
                <span className="font-semibold text-sm" style={{ color: 'var(--brand)' }}>Data loaded successfully</span>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Records</p>
                  <p className="text-xl font-mono" style={{ color: 'var(--text-primary)' }}>{uploadResult.recordCount.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Spend</p>
                  <p className="text-xl font-mono" style={{ color: 'var(--text-primary)' }}>₹{uploadResult.totalSpend.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Source</p>
                  <p className="text-xl font-mono" style={{ color: 'var(--text-primary)' }}>{uploadResult.sourceType}</p>
                </div>
              </div>
              <button
                onClick={() => router.push(`/dashboard?sessionId=${uploadResult.sessionId}&autoAnalyze=true`)}
                className="btn-primary"
              >
                Run Analysis →
              </button>
            </div>
          )}

          {uploadStatus === 'error' && error && (
            <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(255,77,106,0.08)', border: '1px solid rgba(255,77,106,0.25)' }}>
              <p className="text-sm" style={{ color: 'var(--danger)' }}>✕ {error}</p>
            </div>
          )}
        </div>
        )}
      </main>
    </div>
  )
}
