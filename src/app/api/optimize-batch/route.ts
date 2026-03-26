import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendSlackAlert } from '@/lib/slack'

interface BatchRequestBody {
  actionIds: string[]
}

interface ActionResult {
  actionId: string
  title: string
  status: 'fulfilled' | 'rejected'
  result?: string
  error?: string
}

async function executeAction(actionId: string): Promise<ActionResult> {
  const action = await prisma.actionLog.findUnique({
    where: { id: actionId },
    include: { finding: true },
  })

  if (!action || !action.finding) {
    return { actionId, title: '', status: 'rejected', error: 'Action not found' }
  }

  const executionResult: Record<string, unknown> = {}
  const messages: string[] = []

  // Send Slack alert
  try {
    const slackTs = await sendSlackAlert(action, action.finding)
    if (slackTs) {
      executionResult['slack'] = { sent: true, ts: slackTs }
      messages.push('Slack delivered')
    }
  } catch {
    messages.push('Slack skipped (not configured)')
  }

  // Freeze vendor if applicable
  if (action.finding.affectedVendor) {
    await prisma.expense.updateMany({
      where: { vendor: action.finding.affectedVendor, sessionId: action.finding.sessionId },
      data: { isFrozen: true },
    })
    executionResult['vendorFreeze'] = { frozen: true, vendor: action.finding.affectedVendor }
    messages.push(`${action.finding.affectedVendor} frozen`)
  }

  // Create ticket
  const ticketId = `FINCI-${Date.now().toString(36).toUpperCase()}`
  await prisma.ticketLog.create({
    data: {
      ticketId,
      actionLogId: action.id,
      title: action.title,
      status: 'OPEN',
      assigneeDept: action.finding.affectedDepartment ?? 'Operations',
    },
  })
  executionResult['ticket'] = { created: true, ticketId }
  messages.push(`Ticket ${ticketId} created`)

  await prisma.actionLog.update({
    where: { id: action.id },
    data: {
      status: 'AUTO_EXECUTED',
      executedAt: new Date(),
      executionResult: executionResult as never,
      ticketId,
    },
  })

  return {
    actionId,
    title: action.title,
    status: 'fulfilled',
    result: messages.join(' · '),
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as BatchRequestBody
    const { actionIds } = body

    if (!Array.isArray(actionIds) || actionIds.length === 0) {
      return NextResponse.json({ error: 'actionIds array is required' }, { status: 400 })
    }

    // Validate all are AUTO tier
    const actions = await prisma.actionLog.findMany({
      where: { id: { in: actionIds } },
      select: { id: true, approvalTier: true, title: true, estimatedSavingMonthly: true },
    })

    const autoActions = actions.filter((a) => a.approvalTier === 'AUTO')

    // Execute all in parallel
    const results = await Promise.allSettled(
      autoActions.map((a) => executeAction(a.id)),
    )

    const processed: ActionResult[] = results.map((r, i) =>
      r.status === 'fulfilled'
        ? r.value
        : {
            actionId: autoActions[i]?.id ?? '',
            title: autoActions[i]?.title ?? '',
            status: 'rejected' as const,
            error: r.reason instanceof Error ? r.reason.message : 'Unknown error',
          },
    )

    const successCount = processed.filter((r) => r.status === 'fulfilled').length
    const vendorsFrozen = processed
      .filter((r) => r.status === 'fulfilled' && r.result?.includes('frozen'))
      .map((r) => r.result?.split(' frozen')[0] ?? '')
      .filter(Boolean)

    const ticketsCreated = processed
      .filter((r) => r.status === 'fulfilled' && r.result?.includes('FINCI-'))
      .map((r) => r.result?.match(/FINCI-\w+/)?.[0] ?? '')
      .filter(Boolean)

    const totalSavingMonthly = autoActions.reduce((s, a) => s + a.estimatedSavingMonthly, 0)

    return NextResponse.json({
      executed: successCount,
      slackSent: successCount,
      vendorsFrozen,
      ticketsCreated,
      totalSavingMonthly,
      totalSavingAnnual: totalSavingMonthly * 12,
      results: processed,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
