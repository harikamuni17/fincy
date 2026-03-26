export type FreshnessLevel = 'fresh' | 'aging' | 'stale' | 'expired'

export interface DecayResult {
  currentConfidence: number
  ageInDays: number
  decayApplied: number
  isStale: boolean
  freshness: FreshnessLevel
}

export function calculateDecayedConfidence(params: {
  originalConfidence: number
  createdAt: Date
  hasNewDataSince?: Date
}): DecayResult {
  const { originalConfidence, createdAt, hasNewDataSince } = params

  let ageInDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)

  if (hasNewDataSince && hasNewDataSince > createdAt) {
    ageInDays = 0
  }

  const weeklyDecayRate = 0.05
  const decayFactor = Math.max(0, 1 - weeklyDecayRate * (ageInDays / 7))
  const raw = originalConfidence * decayFactor
  const currentConfidence = Math.max(0.1, raw)
  const decayApplied = originalConfidence - currentConfidence

  let freshness: FreshnessLevel
  if (ageInDays <= 7)       freshness = 'fresh'
  else if (ageInDays <= 21) freshness = 'aging'
  else if (ageInDays <= 30) freshness = 'stale'
  else                      freshness = 'expired'

  return {
    currentConfidence,
    ageInDays: Math.round(ageInDays),
    decayApplied,
    isStale: ageInDays > 21,
    freshness,
  }
}
