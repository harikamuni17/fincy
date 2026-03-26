import { prisma } from '@/lib/prisma'
import { sendSlackAlert } from '@/lib/slack'
import type { ActionLog, Finding } from '@prisma/client'

async function freezeVendor(vendorName: string, sessionId: string): Promise<void> {
  await prisma.expense.updateMany({
    where: { vendor: vendorName, sessionId },
    data: { isFrozen: true },
  })
}

async function createFinciTicket(
  action: ActionLog,
  finding: Finding,
): Promise<string> {
  const ticketId = `FINCI-${Date.now().toString(36).toUpperCase()}`
  await prisma.ticketLog.create({
    data: {
      ticketId,
      actionLogId: action.id,
      title: action.title,
      status: 'OPEN',
      assigneeDept: finding.affectedDepartment ?? 'Operations',
    },
  })
  return ticketId
}

export async function runActionAgent(sessionId: string): Promise<{
  autoExecuted: number
  awaitingApproval: number
}> {
  const actions = await prisma.actionLog.findMany({
    where: {
      finding: { sessionId },
    },
    include: { finding: true },
    orderBy: { priority: 'asc' },
  })

  let autoExecuted = 0
  let awaitingApproval = 0

  for (const action of actions) {
    const finding = action.finding

    if (action.approvalTier === 'AUTO') {
      // Execute all 3 autonomous actions
      const executionResult: Record<string, unknown> = {}

      // Action A: Slack alert
      const slackTs = await sendSlackAlert(action, finding)
      if (slackTs) {
        executionResult['slack'] = { sent: true, ts: slackTs }
      }

      // Action B: Vendor freeze (if applicable)
      if (finding.affectedVendor) {
        await freezeVendor(finding.affectedVendor, sessionId)
        executionResult['vendorFreeze'] = { frozen: true, vendor: finding.affectedVendor }
      }

      // Action C: Internal ticket
      const ticketId = await createFinciTicket(action, finding)
      executionResult['ticket'] = { created: true, ticketId }

      await prisma.actionLog.update({
        where: { id: action.id },
        data: {
          status: 'AUTO_EXECUTED',
          executedAt: new Date(),
          executionResult,
          slackMessageTs: slackTs ?? undefined,
          ticketId,
        },
      })

      autoExecuted++
    } else {
      // Non-AUTO: create Slack notification + ticket, set awaiting status
      // Send Slack notification for pending review
      await sendSlackAlert(action, finding)

      // Create ticket for tracking
      const ticketId = await createFinciTicket(action, finding)

      const statusMap: Record<string, string> = {
        MANAGER:  'AWAITING_MANAGER',
        DIRECTOR: 'AWAITING_DIRECTOR',
        CFO:      'AWAITING_CFO',
      }

      await prisma.actionLog.update({
        where: { id: action.id },
        data: {
          status: (statusMap[action.approvalTier] ?? 'PENDING') as never,
          ticketId,
        },
      })

      awaitingApproval++
    }
  }

  return { autoExecuted, awaitingApproval }
}
