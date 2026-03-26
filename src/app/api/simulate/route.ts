import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { format, subMonths, addMonths, startOfMonth } from 'date-fns'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { actionLogId?: string; scenarioParams?: { reductionPercent?: number } }
    const { actionLogId, scenarioParams } = body

    if (!actionLogId) {
      return NextResponse.json({ error: 'actionLogId is required' }, { status: 400 })
    }

    const action = await prisma.actionLog.findUnique({
      where: { id: actionLogId },
      include: { finding: true },
    })

    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 })
    }

    const finding = action.finding
    const reductionPct = (scenarioParams?.reductionPercent ?? 60) / 100

    // Build 6-month baseline from actual expense data
    const now = new Date()
    const baselineMonthlyData: { month: string; amount: number; isForecast: boolean }[] = []

    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i))
      const monthEnd   = startOfMonth(subMonths(now, i - 1))

      const agg = await prisma.expense.aggregate({
        where: {
          session: { findings: { some: { id: finding.id } } },
          vendor: finding.affectedVendor ?? undefined,
          date: { gte: monthStart, lt: monthEnd },
        },
        _sum: { amount: true },
      })

      const amount = agg._sum.amount ?? finding.baselineAmount
      baselineMonthlyData.push({
        month: format(monthStart, 'MMM yyyy'),
        amount: Math.round(amount),
        isForecast: false,
      })
    }

    // Projected: apply the action's reduction from "this month" onwards
    const projectedData: { month: string; amount: number; isForecast: boolean }[] = []
    for (let i = 0; i < 6; i++) {
      const monthStart = startOfMonth(addMonths(now, i))
      const baseline = baselineMonthlyData[5]?.amount ?? finding.anomalyAmount
      const amount = i === 0
        ? Math.round(baseline * (1 - reductionPct * 0.5))       // partial first month
        : Math.round(finding.baselineAmount * (1 - reductionPct * 0.2)) // stabilized

      projectedData.push({
        month: format(monthStart, 'MMM yyyy'),
        amount,
        isForecast: true,
      })
    }

    const saving3m = baselineMonthlyData.slice(3).reduce((s, d) => s + d.amount, 0) -
      projectedData.slice(0, 3).reduce((s, d) => s + d.amount, 0)
    const deltaMonthly = action.estimatedSavingMonthly
    const saving12m = deltaMonthly * 12

    // Upsert simulation
    const simulation = await prisma.simulation.upsert({
      where: { actionLogId },
      update: {
        baselineMonthlyData,
        projectedData,
        projectedSaving3m: Math.round(saving3m),
        projectedSaving12m: Math.round(saving12m),
      },
      create: {
        actionLogId,
        scenarioName: `${action.title} — ${Math.round(reductionPct * 100)}% reduction`,
        baselineMonthlyData,
        projectedData,
        assumptionNotes: `Assumes ${Math.round(reductionPct * 100)}% cost reduction applied from month 1. Implementation cost: ₹0 (no migration effort required).`,
        projectedSaving3m: Math.round(saving3m),
        projectedSaving12m: Math.round(saving12m),
        breakEvenMonths: 0,
      },
    })

    return NextResponse.json({
      simulation,
      baselineData: baselineMonthlyData,
      projectedData,
      saving3m: Math.round(saving3m),
      saving12m: Math.round(saving12m),
      breakEvenMonths: 0,
      scenarioName: simulation.scenarioName,
    })
  } catch (err) {
    console.error('[simulate]', err)
    return NextResponse.json({ error: 'Simulation failed' }, { status: 500 })
  }
}
