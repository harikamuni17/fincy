'use client'

interface OnboardingEmptyStateProps {
  onLoadDemo: () => void
  onUpload: () => void
}

export default function OnboardingEmptyState({ onLoadDemo, onUpload }: OnboardingEmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '40px 20px',
        textAlign: 'center',
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 700 }}>
          <span style={{ color: 'var(--brand)' }}>fi</span>
          <span style={{ color: 'var(--text-primary)' }}>nci</span>
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, letterSpacing: '0.15em', marginTop: 4 }}>
          Autonomous AI CFO
        </p>
      </div>

      {/* Steps */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          alignItems: 'stretch',
          maxWidth: 820,
          width: '100%',
          flexWrap: 'wrap',
        }}
      >
        {/* Step 1 - Active */}
        <div
          style={{
            flex: 1,
            minWidth: 220,
            background: 'var(--bg-surface)',
            border: '1px solid var(--brand)',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 0 0 1px rgba(0,212,170,0.3)',
            transition: 'all 300ms',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--brand)',
              }}
            />
            <p style={{ fontSize: 11, color: 'var(--brand)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Step 1
            </p>
          </div>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 10 }}>
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" />
            <polyline points="17 8 12 3 7 8" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="3" x2="12" y2="15" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            Connect your data
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
            Upload a CSV, PDF bank statement, or use our demo dataset
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onUpload}
              style={{
                flex: 1,
                padding: '8px 0',
                background: 'none',
                border: '1px solid var(--border-bright)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Upload File
            </button>
            <button
              onClick={onLoadDemo}
              style={{
                flex: 1,
                padding: '8px 0',
                background: 'var(--brand)',
                border: 'none',
                borderRadius: 8,
                color: '#000',
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Load Demo
            </button>
          </div>
        </div>

        {/* Connector */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px' }}>
          <div style={{ width: 24, height: 1, background: 'var(--brand)', opacity: 0.3, borderTop: '1px dashed var(--brand)' }} />
        </div>

        {/* Step 2 - Locked */}
        <div
          style={{
            flex: 1,
            minWidth: 220,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 24,
            opacity: 0.5,
            cursor: 'not-allowed',
            position: 'relative',
          }}
        >
          <div style={{ position: 'absolute', top: 12, right: 12 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="var(--text-muted)" strokeWidth="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" stroke="var(--text-muted)" strokeWidth="2" />
            </svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-muted)' }} />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Step 2
            </p>
          </div>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 10 }}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="var(--text-muted)" strokeWidth="2" />
          </svg>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            Run AI analysis
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            4 AI agents scan your data for waste in under 90 seconds
          </p>
        </div>

        {/* Connector */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px' }}>
          <div style={{ width: 24, height: 1, background: 'var(--brand)', opacity: 0.3, borderTop: '1px dashed var(--brand)' }} />
        </div>

        {/* Step 3 - Locked */}
        <div
          style={{
            flex: 1,
            minWidth: 220,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 24,
            opacity: 0.5,
            cursor: 'not-allowed',
            position: 'relative',
          }}
        >
          <div style={{ position: 'absolute', top: 12, right: 12 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="var(--text-muted)" strokeWidth="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" stroke="var(--text-muted)" strokeWidth="2" />
            </svg>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-muted)' }} />
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Step 3
            </p>
          </div>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 10 }}>
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="17 6 23 6 23 12" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
            See your savings
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Get prioritized actions to save ₹12L+ annually
          </p>
        </div>
      </div>

      {/* Social proof */}
      <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Join companies saving an average of ₹12L/year
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          {['TechCorp', 'RetailCo', 'MfgLtd'].map((name) => (
            <div
              key={name}
              style={{
                padding: '5px 14px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                fontSize: 12,
                color: 'var(--text-muted)',
                width: 70,
                textAlign: 'center',
              }}
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
