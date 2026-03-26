import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runForecastEngine } from '@/lib/forecastEngine'

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId')
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
    }

    // Check for existing forecasts first
    const existing = await prisma.forecastRecord.findMany({
      where: { sessionId },
      orderBy: { forecastMonth: 'asc' },
    })

    if (existing.length > 0) {
      return NextResponse.json({ forecasts: existing })
    }

    const result = await runForecastEngine(sessionId)
    return NextResponse.json({
      forecasts: result.forecastRecords,
      alerts: result.alerts,
      nextMonthProjectedWaste: result.nextMonthProjectedWaste,
    })
  } catch (err) {
    console.error('[forecast]', err)
    return NextResponse.json({ error: 'Forecast failed' }, { status: 500 })
  }
}
