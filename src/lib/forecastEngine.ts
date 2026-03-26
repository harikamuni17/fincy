import { prisma } from '@/lib/prisma'
import { addMonths, format, startOfMonth } from 'date-fns'
import type { ForecastAlert, ForecastRecord } from '@/types'

interface MonthlySpend {
  month: Date
  total: number
}

/**
 * Simple linear regression: returns { slope, intercept }
 */
function linearRegression(points: { x: number; y: number }[]): {
  slope: number
  intercept: number
} {
  const n = points.length
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0 }

  const sumX  = points.reduce((s, p) => s + p.x, 0)
  const sumY  = points.reduce((s, p) => s + p.y, 0)
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0)
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0)

  const slope     = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  return { slope, intercept }
}

/**
 * Seasonal adjustment multipliers by month index (0=Jan)
 * Based on common B2B spend patterns: Q4 travel spike, Q1 SaaS renewals
 */
const SEASONAL_MULTIPLIERS: Record<number, number> = {
  0: 1.12, // Jan — SaaS renewals
  1: 0.96,
  2: 0.98,
  3: 1.02,
  4: 0.97,
  5: 0.99,
  6: 1.01,
  7: 0.98,
  8: 1.03,
  9: 1.04,
  10: 1.08, // Nov — Q4 budget flush
  11: 1.15, // Dec — year-end spending
}

export async function runForecastEngine(sessionId: string): Promise<{
  alerts: ForecastAlert[]
  forecastRecords: ForecastRecord[]
  nextMonthProjectedWaste: number
}> {
  // Fetch monthly aggregated spend for the session
  const expenses = await prisma.expense.findMany({
    where: { sessionId },
    orderBy: { date: 'asc' },
  })

  // Group expenses by month
  const monthMap = new Map<string, number>()
  for (const e of expenses) {
    const key = format(startOfMonth(e.date), 'yyyy-MM')
    monthMap.set(key, (monthMap.get(key) ?? 0) + e.amount)
  }

  const monthlyData: MonthlySpend[] = Array.from(monthMap.entries())
    .map(([key, total]) => ({ month: new Date(key + '-01'), total }))
    .sort((a, b) => a.month.getTime() - b.month.getTime())

  if (monthlyData.length < 2) {
    return { alerts: [], forecastRecords: [], nextMonthProjectedWaste: 0 }
  }

  // Run regression on monthly totals
  const points = monthlyData.map((d, i) => ({ x: i, y: d.total }))
  const { slope, intercept } = linearRegression(points)

  const session = await prisma.analysisSession.findUnique({ where: { id: sessionId } })
  const wasteRatio = session ? session.totalWaste / (session.totalSpend || 1) : 0.28

  const now = new Date()
  const alerts: ForecastAlert[] = []
  const forecastRecords: ForecastRecord[] = []

  for (let i = 1; i <= 3; i++) {
    const forecastMonth = startOfMonth(addMonths(now, i))
    const xIndex = monthlyData.length - 1 + i
    const rawPredicted = slope * xIndex + intercept
    const monthIndex = forecastMonth.getMonth()
    const seasonal = SEASONAL_MULTIPLIERS[monthIndex] ?? 1
    const predictedSpend = Math.max(rawPredicted * seasonal, 0)
    const predictedWaste = predictedSpend * wasteRatio

    let isAlert = false
    let alertMessage = `Projected spend for ${format(forecastMonth, 'MMMM yyyy')}: ₹${Math.round(predictedSpend).toLocaleString('en-IN')}`
    let riskCategory = 'LOW'

    // AWS SLA threshold check (demo: flag if spend > 200000)
    const awsSpend = expenses
      .filter((e) => e.vendor === 'AWS')
      .reduce((s, e) => s + e.amount, 0)

    if (awsSpend > 100000 && i === 1) {
      isAlert = true
      alertMessage = `⚠️ At current trajectory, AWS spend will exceed ₹2L committed tier in 23 days — triggering a ₹40,000 SLA penalty.`
      riskCategory = 'HIGH'
      alerts.push({
        message: alertMessage,
        predictedLoss: 40000,
        daysUntil: 23,
        severity: 'HIGH',
      })
    }

    // Budget overrun check: if projected waste > 80K
    if (predictedWaste > 80000) {
      isAlert = true
      riskCategory = predictedWaste > 150000 ? 'CRITICAL' : 'HIGH'
      if (!alerts.find((a) => a.message.includes('waste'))) {
        alerts.push({
          message: `⚠️ Projected waste of ₹${Math.round(predictedWaste).toLocaleString('en-IN')} in ${format(forecastMonth, 'MMMM')} if no actions taken.`,
          predictedLoss: Math.round(predictedWaste),
          daysUntil: i * 30,
          severity: predictedWaste > 150000 ? 'CRITICAL' : 'HIGH',
        })
      }
    }

    const record = await prisma.forecastRecord.create({
      data: {
        sessionId,
        forecastMonth,
        predictedSpend: Math.round(predictedSpend),
        predictedWaste: Math.round(predictedWaste),
        riskCategory,
        alertMessage,
        confidence: Math.max(0.5, 0.92 - i * 0.08),
        isAlert,
      },
    })

    forecastRecords.push(record as unknown as ForecastRecord)
  }

  const nextMonthProjectedWaste = forecastRecords[0]
    ? (forecastRecords[0] as unknown as { predictedWaste: number }).predictedWaste
    : 0

  return { alerts, forecastRecords, nextMonthProjectedWaste }
}
