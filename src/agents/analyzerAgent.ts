import { prisma } from '@/lib/prisma'
import { openai, OPENAI_MODEL } from '@/lib/openai'
import { calculateZScore, zScoreToConfidence, buildCalculationSteps } from '@/lib/savingsCalculator'
import { format, startOfMonth } from 'date-fns'
import type { CalculationStep } from '@/types'

interface AnomalyGroup {
  key: string
  vendor: string
  category: string
  department: string
  historicalValues: number[]
  currentValue: number
  mean: number
  stdDev: number
  zScore: number
  delta: number
  confidence: number
}

interface AIFinding {
  title: string
  description: string
  findingType: string
  severity: string
  affectedVendor?: string
  affectedDepartment?: string
  affectedCategory?: string
  riskScore: number
}

const analyzerFunction = {
  name: 'classify_expense_anomalies',
  description: 'Classify detected statistical anomalies into structured findings with severity and type',
  parameters: {
    type: 'object',
    properties: {
      findings: {
        type: 'array',
        items: {
          type: 'object',
          required: ['title', 'description', 'findingType', 'severity', 'riskScore'],
          properties: {
            title: { type: 'string', description: 'Concise 5–8 word title' },
            description: { type: 'string', description: '2 sentence explanation for a CFO' },
            findingType: {
              type: 'string',
              enum: [
                'SPEND_SPIKE', 'DUPLICATE_VENDOR', 'BUDGET_OVERRUN',
                'UNUSUAL_PATTERN', 'VENDOR_CONCENTRATION', 'POLICY_VIOLATION',
                'UNDERUTILIZED_LICENSE', 'SLA_RISK',
              ],
            },
            severity: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
            affectedVendor: { type: 'string' },
            affectedDepartment: { type: 'string' },
            affectedCategory: { type: 'string' },
            riskScore: { type: 'number', minimum: 0, maximum: 1 },
          },
        },
      },
    },
    required: ['findings'],
  },
}

export async function runAnalyzerAgent(sessionId: string): Promise<{
  findingsCount: number
  totalWaste: number
  overspendPercent: number
}> {
  const expenses = await prisma.expense.findMany({
    where: { sessionId },
    orderBy: { date: 'asc' },
  })

  if (expenses.length === 0) {
    return { findingsCount: 0, totalWaste: 0, overspendPercent: 0 }
  }

  // Group expenses by vendor+department key
  type GroupMap = Map<string, { vendor: string; category: string; department: string; byMonth: Map<string, number> }>
  const groups: GroupMap = new Map()

  for (const e of expenses) {
    const key = `${e.vendor}||${e.department}`
    if (!groups.has(key)) {
      groups.set(key, {
        vendor: e.vendor,
        category: e.category,
        department: e.department,
        byMonth: new Map(),
      })
    }
    const monthKey = format(startOfMonth(e.date), 'yyyy-MM')
    const g = groups.get(key)!
    g.byMonth.set(monthKey, (g.byMonth.get(monthKey) ?? 0) + e.amount)
  }

  // Detect anomalies using z-score on the latest month
  const anomalies: AnomalyGroup[] = []

  for (const [key, group] of groups) {
    const sortedMonths = Array.from(group.byMonth.entries()).sort(([a], [b]) => a.localeCompare(b))
    if (sortedMonths.length < 2) continue

    const currentValue = sortedMonths[sortedMonths.length - 1][1]
    const historicalValues = sortedMonths.slice(0, -1).map(([, v]) => v)
    const { mean, stdDev, zScore } = calculateZScore(historicalValues, currentValue)

    if (Math.abs(zScore) > 2.0) {
      const delta = currentValue - mean
      const confidence = zScoreToConfidence(zScore)
      anomalies.push({
        key,
        vendor: group.vendor,
        category: group.category,
        department: group.department,
        historicalValues,
        currentValue,
        mean,
        stdDev,
        zScore,
        delta,
        confidence,
      })
    }
  }

  if (anomalies.length === 0) {
    return { findingsCount: 0, totalWaste: 0, overspendPercent: 0 }
  }

  // Call OpenAI to classify anomalies
  let aiFindings: AIFinding[] = []

  try {
    const prompt = anomalies.map((a) =>
      `Vendor: ${a.vendor} | Dept: ${a.department} | Category: ${a.category} | ` +
      `Historical avg: ₹${Math.round(a.mean).toLocaleString('en-IN')} | ` +
      `Current value: ₹${Math.round(a.currentValue).toLocaleString('en-IN')} | ` +
      `Z-score: ${a.zScore.toFixed(2)} | Delta: ₹${Math.round(a.delta).toLocaleString('en-IN')}`
    ).join('\n')

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a CFO-level financial analyst. Classify these expense anomalies for a B2B SaaS company in India. Be specific, business-relevant, and name the vendor/department in the title.',
        },
        { role: 'user', content: prompt },
      ],
      tools: [{ type: 'function', function: analyzerFunction }],
      tool_choice: { type: 'function', function: { name: 'classify_expense_anomalies' } },
    })

    const toolCall = response.choices[0]?.message?.tool_calls?.[0]
    if (toolCall?.function.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments) as { findings: AIFinding[] }
      aiFindings = parsed.findings
    }
  } catch (err) {
    console.error('[Analyzer] OpenAI call failed, using fallback classification:', err)
    // Fallback: generate findings without AI enrichment
    aiFindings = anomalies.map((a) => ({
      title: `${a.vendor} Spend Anomaly — ${a.department}`,
      description: `${a.vendor} spend was ${a.zScore.toFixed(1)}× above the historical average in the latest month. This represents a potential waste of ₹${Math.round(a.delta).toLocaleString('en-IN')} requiring immediate review.`,
      findingType: a.delta > 50000 ? 'SPEND_SPIKE' : 'UNUSUAL_PATTERN',
      severity: Math.abs(a.zScore) > 3 ? 'CRITICAL' : Math.abs(a.zScore) > 2.5 ? 'HIGH' : 'MEDIUM',
      affectedVendor: a.vendor,
      affectedDepartment: a.department,
      affectedCategory: a.category,
      riskScore: Math.min(0.99, Math.abs(a.zScore) / 5),
    }))
  }

  // Insert findings into DB
  let totalWaste = 0
  const findings = await prisma.$transaction(
    anomalies.slice(0, aiFindings.length).map((anomaly, idx) => {
      const aiFinding = aiFindings[idx]
      const delta = Math.abs(anomaly.delta)
      totalWaste += delta

      const calculationSteps: CalculationStep[] = buildCalculationSteps({
        groupLabel: `${anomaly.vendor} (${anomaly.department})`,
        n: anomaly.historicalValues.length,
        mean: anomaly.mean,
        currentValue: anomaly.currentValue,
        delta: anomaly.delta,
        zScore: anomaly.zScore,
        confidence: anomaly.confidence,
      })

      return prisma.finding.create({
        data: {
          sessionId,
          title: aiFinding.title,
          description: aiFinding.description,
          findingType: aiFinding.findingType as never,
          severity: aiFinding.severity as never,
          riskScore: aiFinding.riskScore,
          baselineAmount: Math.round(anomaly.mean),
          anomalyAmount: Math.round(anomaly.currentValue),
          deltaAmount: Math.round(delta),
          projectedAnnualWaste: Math.round(delta * 12),
          confidenceScore: anomaly.confidence,
          calculationMethod: 'z-score anomaly detection',
          calculationSteps: calculationSteps as never,
          affectedVendor: aiFinding.affectedVendor ?? anomaly.vendor,
          affectedDepartment: aiFinding.affectedDepartment ?? anomaly.department,
          affectedCategory: aiFinding.affectedCategory ?? anomaly.category,
        },
      })
    }),
  )

  const session = await prisma.analysisSession.findUnique({ where: { id: sessionId } })
  const totalSpend = session?.totalSpend ?? 1
  const overspendPct = totalSpend > 0 ? (totalWaste / totalSpend) * 100 : 0

  await prisma.analysisSession.update({
    where: { id: sessionId },
    data: {
      totalWaste: Math.round(totalWaste),
      overspendPct: parseFloat(overspendPct.toFixed(1)),
      status: 'ANALYZING',
    },
  })

  return {
    findingsCount: findings.length,
    totalWaste: Math.round(totalWaste),
    overspendPercent: parseFloat(overspendPct.toFixed(1)),
  }
}
