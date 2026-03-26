import type { ActionLog, Finding } from '@prisma/client'

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL

export async function sendSlackAlert(
  action: ActionLog,
  finding: Finding,
): Promise<string | null> {
  if (!SLACK_WEBHOOK_URL) {
    console.warn('[Slack] SLACK_WEBHOOK_URL not configured — skipping alert')
    return null
  }

  const payload = {
    text: `🚨 *Finci Alert* — ${action.title}`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🚨 Finci AI CFO Alert' },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Finding:*\n${finding.title}` },
          {
            type: 'mrkdwn',
            text: `*Monthly Waste:*\n₹${finding.deltaAmount.toLocaleString('en-IN')}`,
          },
          {
            type: 'mrkdwn',
            text: `*Department:*\n${finding.affectedDepartment ?? 'N/A'}`,
          },
          { type: 'mrkdwn', text: `*Action:*\n${action.actionType}` },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Annual risk if unaddressed:* ₹${(finding.deltaAmount * 12).toLocaleString('en-IN')}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Recommended action:*\n${action.description}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '🔍 View in Finci' },
            style: 'primary',
            url: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
          },
        ],
      },
    ],
  }

  try {
    const res = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      console.error(`[Slack] Webhook returned ${res.status}: ${await res.text()}`)
      return null
    }

    // Slack webhook doesn't return a timestamp — return ISO timestamp
    return new Date().toISOString()
  } catch (err) {
    console.error('[Slack] Failed to send webhook:', err)
    return null
  }
}
