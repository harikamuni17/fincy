import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId')

    const whereClause = sessionId
      ? { finding: { sessionId } }
      : {}

    const roiRecords = await prisma.rOIRecord.findMany({
      where: whereClause,
      include: {
        action: {
          select: {
            title: true,
            actionType: true,
            approvalTier: true,
            estimatedSavingMonthly: true,
            estimatedSavingAnnual: true,
            finding: {
              select: {
                affectedVendor: true,
                affectedDepartment: true,
                severity: true,
              },
            },
          },
        },
      },
      orderBy: { measuredAt: 'desc' },
    })

    const totalPredicted = roiRecords.reduce((s, r) => s + r.predictedSaving, 0)
    const totalActual    = roiRecords.reduce((s, r) => s + r.actualSaving, 0)
    const avgAccuracy    = roiRecords.length > 0
      ? roiRecords.reduce((s, r) => s + r.accuracy, 0) / roiRecords.length
      : 0

    return NextResponse.json({ roiRecords, totalPredicted, totalActual, avgAccuracy })
  } catch (err) {
    console.error('[roi]', err)
    return NextResponse.json({ error: 'Failed to fetch ROI data' }, { status: 500 })
  }
}
