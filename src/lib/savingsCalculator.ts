import type { CalculationStep } from '@/types'

/**
 * Format a number as Indian currency string (₹X,XX,XXX)
 */
export function formatINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN')
}

/**
 * Calculate z-score for a value against a set of historical values
 */
export function calculateZScore(values: number[], currentValue: number): {
  mean: number
  stdDev: number
  zScore: number
} {
  const n = values.length
  if (n === 0) return { mean: 0, stdDev: 0, zScore: 0 }

  const mean = values.reduce((s, v) => s + v, 0) / n
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n
  const stdDev = Math.sqrt(variance)
  const zScore = stdDev === 0 ? 0 : (currentValue - mean) / stdDev

  return { mean, stdDev, zScore }
}

/**
 * Convert z-score to confidence probability (using approximation)
 */
export function zScoreToConfidence(zScore: number): number {
  const absZ = Math.abs(zScore)
  // Approximate cumulative normal distribution
  const t = 1 / (1 + 0.2316419 * absZ)
  const poly =
    t * (0.319381530 +
    t * (-0.356563782 +
    t * (1.781477937 +
    t * (-1.821255978 +
    t * 1.330274429))))
  const prob = 1 - (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * absZ * absZ) * poly
  return Math.min(0.99, Math.max(0.5, prob))
}

/**
 * Build standard calculation steps array for a z-score anomaly finding
 */
export function buildCalculationSteps(params: {
  groupLabel: string
  n: number
  mean: number
  currentValue: number
  delta: number
  zScore: number
  confidence: number
}): CalculationStep[] {
  const { groupLabel, n, mean, currentValue, delta, zScore, confidence } = params
  return [
    {
      step: 'baseline_avg',
      value: Math.round(mean),
      unit: 'INR',
      explanation: `Average ${groupLabel} spend over ${n} months: ₹${Math.round(mean).toLocaleString('en-IN')}`,
    },
    {
      step: 'current_value',
      value: Math.round(currentValue),
      unit: 'INR',
      explanation: `This month's ${groupLabel} spend: ₹${Math.round(currentValue).toLocaleString('en-IN')}`,
    },
    {
      step: 'delta',
      value: Math.round(delta),
      unit: 'INR',
      explanation: `Excess spend: ₹${Math.round(currentValue).toLocaleString('en-IN')} - ₹${Math.round(mean).toLocaleString('en-IN')} = ₹${Math.round(delta).toLocaleString('en-IN')}`,
    },
    {
      step: 'z_score',
      value: parseFloat(zScore.toFixed(2)),
      unit: 'zscore',
      explanation: `Z-score: ${zScore.toFixed(2)} — ${Math.abs(zScore) > 3 ? 'highly' : 'moderately'} anomalous`,
    },
    {
      step: 'confidence',
      value: parseFloat((confidence * 100).toFixed(1)),
      unit: 'percent',
      explanation: `${(confidence * 100).toFixed(0)}% confidence this is not normal variation`,
    },
    {
      step: 'annual_projection',
      value: Math.round(delta * 12),
      unit: 'INR',
      explanation: `If this continues: ₹${Math.round(delta).toLocaleString('en-IN')} × 12 = ₹${Math.round(delta * 12).toLocaleString('en-IN')}/year at risk`,
    },
  ]
}

/**
 * Determine approval tier based on monthly saving amount (INR)
 */
export function computeApprovalTier(amount: number): 'AUTO' | 'MANAGER' | 'DIRECTOR' | 'CFO' {
  const thresholdAuto      = parseFloat(process.env.THRESHOLD_AUTO      ?? '500')
  const thresholdManager   = parseFloat(process.env.THRESHOLD_MANAGER   ?? '5000')
  const thresholdDirector  = parseFloat(process.env.THRESHOLD_DIRECTOR  ?? '20000')

  if (amount < thresholdAuto)     return 'AUTO'
  if (amount < thresholdManager)  return 'MANAGER'
  if (amount < thresholdDirector) return 'DIRECTOR'
  return 'CFO'
}

/**
 * Sum an array of numbers
 */
export function sumArray(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0)
}

/**
 * Calculate a 0–100 Budget Health Score
 */
export function calculateHealthScore(params: {
  overspendPct: number
  criticalFindings: number
  highFindings: number
  unaddressedActions: number
  forecastRiskLevel: number
  totalWaste: number
  totalSpend: number
}): { score: number; grade: 'A' | 'B' | 'C' | 'D' | 'F'; label: string; color: string } {
  const {
    overspendPct,
    criticalFindings,
    highFindings,
    unaddressedActions,
    forecastRiskLevel,
  } = params

  const base = 100
  const raw =
    base -
    overspendPct * 0.4 -
    criticalFindings * 10 -
    highFindings * 5 -
    unaddressedActions * 3 -
    forecastRiskLevel * 15

  const score = Math.max(0, Math.min(100, Math.round(raw)))

  if (score >= 80) return { score, grade: 'A', label: 'Financially Healthy',   color: '#00D4AA' }
  if (score >= 60) return { score, grade: 'B', label: 'Minor Inefficiencies',  color: '#6C8EFF' }
  if (score >= 40) return { score, grade: 'C', label: 'Needs Attention',       color: '#FFB547' }
  if (score >= 20) return { score, grade: 'D', label: 'High Risk',             color: '#FF8C42' }
  return               { score, grade: 'F', label: 'Critical Overspend',     color: '#FF4D6A' }
}
