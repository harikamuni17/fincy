import { prisma } from '@/lib/prisma'
import { openai, OPENAI_MODEL } from '@/lib/openai'
import { computeApprovalTier } from '@/lib/savingsCalculator'
import type { TopAction } from '@/types'

interface AIActionRecommendation {
  title: string
  description: string
  actionType: 'VENDOR_FREEZE' | 'SLACK_ALERT' | 'TICKET_CREATE' | 'BUDGET_ADJUSTMENT' | 'LICENSE_REDUCTION'
  estimatedSavingMonthly: number
  estimatedSavingAnnual: number
  confidenceScore: number
}

const decisionFunction = {
  name: 'recommend_cost_actions',
  description:
    'Recommend specific, immediately actionable cost-saving actions for each financial anomaly finding',
  parameters: {
    type: 'object',
    properties: {
      actions: {
        type: 'array',
        items: {
          type: 'object',
          required: ['findingIndex', 'title', 'description', 'actionType', 'estimatedSavingMonthly', 'estimatedSavingAnnual', 'confidenceScore'],
          properties: {
            findingIndex: { type: 'number' },
            title: {
              type: 'string',
              description:
                'Action verb title naming the vendor. E.g. "Reduce Slack licenses from 200 to 140 seats — save ₹38,000/month"',
            },
            description: { type: 'string' },
            actionType: {
              type: 'string',
              enum: ['VENDOR_FREEZE', 'SLACK_ALERT', 'TICKET_CREATE', 'BUDGET_ADJUSTMENT', 'LICENSE_REDUCTION'],
            },
            estimatedSavingMonthly: { type: 'number', description: 'Monthly saving in INR' },
            estimatedSavingAnnual: { type: 'number', description: 'Annual saving in INR' },
            confidenceScore: { type: 'number', minimum: 0, maximum: 1 },
          },
        },
      },
    },
    required: ['actions'],
  },
}

export async function runDecisionAgent(sessionId: string): Promise<{
  actionsCount: number
  topThreeActions: TopAction[]
}> {
  const findings = await prisma.finding.findMany({
    where: { sessionId },
    orderBy: { projectedAnnualWaste: 'desc' },
  })

  if (findings.length === 0) {
    return { actionsCount: 0, topThreeActions: [] }
  }

  let aiActions: (AIActionRecommendation & { findingIndex: number })[] = []

  try {
    const prompt = findings.map((f, i) =>
      `[${i}] Finding: "${f.title}" | Type: ${f.findingType} | Severity: ${f.severity} | ` +
      `Monthly waste: ₹${f.deltaAmount.toLocaleString('en-IN')} | ` +
      `Annual risk: ₹${f.projectedAnnualWaste.toLocaleString('en-IN')} | ` +
      `Vendor: ${f.affectedVendor ?? 'N/A'} | Dept: ${f.affectedDepartment ?? 'N/A'}`
    ).join('\n')

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a CFO deciding on corrective cost actions. For each finding, recommend ONE specific action that maximizes cost savings. Return estimated monthly savings in INR. Be specific: name the vendor, the license type, the contract term. Format title as action verb: "Reduce Slack licenses from 200 to 140 seats — save ₹38,000/month". This is for a B2B SaaS startup in India.',
        },
        { role: 'user', content: prompt },
      ],
      tools: [{ type: 'function', function: decisionFunction }],
      tool_choice: { type: 'function', function: { name: 'recommend_cost_actions' } },
    })

    const toolCall = response.choices[0]?.message?.tool_calls?.[0]
    if (toolCall?.function.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments) as {
        actions: (AIActionRecommendation & { findingIndex: number })[]
      }
      aiActions = parsed.actions
    }
  } catch (err) {
    console.error('[Decision] OpenAI call failed, using fallback actions:', err)
    // Fallback: generate basic actions from findings
    aiActions = findings.map((f, i) => ({
      findingIndex: i,
      title: `Resolve ${f.affectedVendor ?? 'vendor'} anomaly — save ₹${f.deltaAmount.toLocaleString('en-IN')}/mo`,
      description: `Review and address the anomalous ${f.findingType.toLowerCase().replace(/_/g, ' ')} in ${f.affectedDepartment ?? 'operations'}. Estimated monthly savings: ₹${f.deltaAmount.toLocaleString('en-IN')}.`,
      actionType: 'TICKET_CREATE' as const,
      estimatedSavingMonthly: f.deltaAmount,
      estimatedSavingAnnual: f.projectedAnnualWaste,
      confidenceScore: f.confidenceScore,
    }))
  }

  // Sort by estimated saving (highest first) and assign priority
  aiActions.sort((a, b) => b.estimatedSavingMonthly - a.estimatedSavingMonthly)

  // Insert action logs with priority ranking
  const insertedActions = await prisma.$transaction(
    aiActions.map((action, rankIdx) => {
      const finding = findings[action.findingIndex] ?? findings[0]
      const tier = computeApprovalTier(action.estimatedSavingMonthly)

      return prisma.actionLog.create({
        data: {
          findingId: finding.id,
          title: action.title,
          description: action.description,
          actionType: action.actionType,
          status: tier === 'AUTO' ? 'AUTO_EXECUTED' : `AWAITING_${tier}` as never,
          priority: rankIdx + 1,
          approvalTier: tier,
          estimatedSavingMonthly: Math.round(action.estimatedSavingMonthly),
          estimatedSavingAnnual: Math.round(action.estimatedSavingAnnual),
          dollarThreshold: Math.round(action.estimatedSavingMonthly),
        },
      })
    }),
  )

  const topThreeActions: TopAction[] = insertedActions.slice(0, 3).map((a, i) => ({
    rank: i + 1,
    title: a.title,
    savingMonthly: a.estimatedSavingMonthly,
    savingAnnual: a.estimatedSavingAnnual,
    confidence: aiActions[i]?.confidenceScore ?? 0.85,
  }))

  return { actionsCount: insertedActions.length, topThreeActions }
}
