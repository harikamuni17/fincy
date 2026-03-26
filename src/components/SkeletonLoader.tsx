interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: number
  style?: React.CSSProperties
}

function SkeletonBlock({ width = '100%', height = 20, borderRadius = 6, style }: SkeletonProps) {
  return (
    <div style={{ width, height, borderRadius, background: 'linear-gradient(90deg, #1E2535 25%, #2A3246 50%, #1E2535 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', ...style }} />
  )
}

export function SkeletonCard() {
  return (
    <div style={{ background: '#0D0F14', border: '1px solid #1E2535', borderRadius: 14, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <SkeletonBlock width={80} height={12} borderRadius={4} />
        <SkeletonBlock width={40} height={20} borderRadius={10} />
      </div>
      <SkeletonBlock height={32} borderRadius={4} />
      <SkeletonBlock width="70%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <SkeletonBlock width={60} height={8} borderRadius={4} />
        <SkeletonBlock width={80} height={8} borderRadius={4} />
        <SkeletonBlock width={50} height={8} borderRadius={4} />
      </div>
      <style>{`@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }`}</style>
    </div>
  )
}

export function SkeletonFindingCard() {
  return (
    <div style={{ background: '#0D0F14', border: '1px solid #1E2535', borderRadius: 14, padding: 24 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <SkeletonBlock width={60} height={20} borderRadius={10} />
        <SkeletonBlock width={80} height={20} borderRadius={10} />
      </div>
      <SkeletonBlock height={18} borderRadius={4} />
      <SkeletonBlock width="85%" height={18} borderRadius={4} style={{ marginTop: 8 }} />
      <SkeletonBlock height={12} borderRadius={4} style={{ marginTop: 6 }} />
      <SkeletonBlock width="60%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
      <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
        {[0, 1, 2].map(i => <SkeletonBlock key={i} width={80} height={36} borderRadius={8} />)}
      </div>
      <style>{`@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }`}</style>
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, padding: '12px 0', borderBottom: '1px solid #1E2535', alignItems: 'center' }}>
          <SkeletonBlock width={16} height={16} borderRadius={3} />
          <SkeletonBlock width={120} height={12} borderRadius={4} />
          <SkeletonBlock width={80} height={12} borderRadius={4} />
          <SkeletonBlock width={60} height={12} borderRadius={4} style={{ marginLeft: 'auto' }} />
        </div>
      ))}
      <style>{`@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }`}</style>
    </div>
  )
}

export default SkeletonBlock
