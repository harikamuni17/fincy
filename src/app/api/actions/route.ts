import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId')
    const status = req.nextUrl.searchParams.get('status')
    const tier = req.nextUrl.searchParams.get('tier')

    const whereClause: Record<string, unknown> = {}
    if (sessionId) whereClause['finding'] = { sessionId }
    if (status) whereClause['status'] = status
    if (tier) whereClause['approvalTier'] = tier

    const actions = await prisma.actionLog.findMany({
      where: whereClause,
      include: {
        finding: {
          select: {
            id: true, title: true, severity: true, affectedVendor: true,
            affectedDepartment: true, deltaAmount: true, projectedAnnualWaste: true,
          },
        },
        approvedBy: { select: { name: true, email: true, role: true } },
        roiRecord: true,
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ actions })
  } catch (err) {
    console.error('[actions GET]', err)
    return NextResponse.json({ error: 'Failed to fetch actions' }, { status: 500 })
  }
}
