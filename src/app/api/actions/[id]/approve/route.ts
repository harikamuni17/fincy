import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const approveSchema = z.object({
  reasonCode: z.enum([
    'APPROVED_SAVINGS_VERIFIED',
    'REJECTED_BUDGET_CONSTRAINTS',
    'REJECTED_VENDOR_CONTRACT',
    'REJECTED_INSUFFICIENT_EVIDENCE',
    'REJECTED_ESCALATED',
    'DELEGATED_TO_DEPARTMENT',
  ]),
  reasonNote: z.string().optional(),
  approvedById: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json() as unknown
    const parsed = approveSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'reasonCode is required', details: parsed.error.flatten() }, { status: 400 })
    }

    const action = await prisma.actionLog.findUnique({
      where: { id: params.id },
      include: { finding: true },
    })

    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 })
    }

    if (!['AWAITING_MANAGER', 'AWAITING_DIRECTOR', 'AWAITING_CFO', 'PENDING'].includes(action.status)) {
      return NextResponse.json({ error: 'Action is not awaiting approval' }, { status: 409 })
    }

    const updated = await prisma.actionLog.update({
      where: { id: params.id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: parsed.data.approvedById ?? null,
        reasonCode: parsed.data.reasonCode,
        reasonNote: parsed.data.reasonNote ?? null,
        executedAt: new Date(),
        executionResult: {
          executedVia: 'approval_workflow',
          approvedAt: new Date().toISOString(),
          reasonCode: parsed.data.reasonCode,
        },
      },
      include: {
        finding: true,
        approvedBy: { select: { name: true, email: true } },
      },
    })

    return NextResponse.json({ action: updated, success: true })
  } catch (err) {
    console.error('[actions/approve]', err)
    return NextResponse.json({ error: 'Failed to approve action' }, { status: 500 })
  }
}
