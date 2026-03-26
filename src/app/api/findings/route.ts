import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId')
    const severity   = req.nextUrl.searchParams.get('severity')

    const whereClause: Record<string, unknown> = {}
    if (sessionId) whereClause['sessionId'] = sessionId
    if (severity)  whereClause['severity']  = severity

    const findings = await prisma.finding.findMany({
      where: whereClause,
      orderBy: [{ severity: 'asc' }, { projectedAnnualWaste: 'desc' }],
    })

    return NextResponse.json({ findings })
  } catch (err) {
    console.error('[findings GET]', err)
    return NextResponse.json({ error: 'Failed to fetch findings' }, { status: 500 })
  }
}
