import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const rejectSchema = z.object({
  reasonCode: z.enum([
    'REJECTED_BUDGET_CONSTRAINTS',
    'REJECTED_VENDOR_CONTRACT',
    'REJECTED_INSUFFICIENT_EVIDENCE',
    'REJECTED_ESCALATED',
    'DELEGATED_TO_DEPARTMENT',
  ]),
  reasonNote: z.string().min(1, 'A reason note is required when rejecting'),
  rejectedById: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json() as unknown
    const parsed = rejectSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid rejection data', details: parsed.error.flatten() }, { status: 400 })
    }

    const action = await prisma.actionLog.findUnique({
      where: { id: params.id },
    })

    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 })
    }

    const updated = await prisma.actionLog.update({
      where: { id: params.id },
      data: {
        status: 'REJECTED',
        updatedAt: new Date(),
        approvedById: parsed.data.rejectedById ?? null,
        reasonCode: parsed.data.reasonCode,
        reasonNote: parsed.data.reasonNote,
        executionResult: {
          rejectedVia: 'approval_workflow',
          rejectedAt: new Date().toISOString(),
          reasonCode: parsed.data.reasonCode,
          note: parsed.data.reasonNote,
        },
      },
    })

    return NextResponse.json({ action: updated, success: true })
  } catch (err) {
    console.error('[actions/reject]', err)
    return NextResponse.json({ error: 'Failed to reject action' }, { status: 500 })
  }
}
