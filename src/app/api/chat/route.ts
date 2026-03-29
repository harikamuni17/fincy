import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { openai, OPENAI_MODEL } from '@/lib/openai'

const DEMO_CHAT_QUERY = 'why did aws costs spike?'
const DEMO_CHAT_RESPONSE =
  'Your AWS cloud spend spiked because of a March anomaly in on-demand infrastructure and unreserved instance usage. Fixing this issue can save roughly ₹52,000 per month.'

function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

function createTextStream(message: string) {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(message))
      controller.close()
    },
  })
}

function generateFallbackResponse(message: string, session: any, findings: any[], actions: any[]) {
  const text = message.trim().toLowerCase()
  const topFinding = findings[0]
  const topAction = actions[0]

  if (!session) {
    if (text === DEMO_CHAT_QUERY) {
      return DEMO_CHAT_RESPONSE
    }
    if (text.includes('why') && text.includes('aws')) {
      return `AWS spend is the top issue in this demo because of an AWS bill anomaly. The likely saving opportunity is about ₹52,000 per month.`
    }
    return 'No active analysis session is available. Upload or load demo data first so the chat can answer your questions. For a static demo, ask: "Why did AWS costs spike?"'
  }

  if (text.includes('why') && text.includes('aws')) {
    return `AWS is one of your largest risk areas. The top finding shows a high-priority AWS anomaly with a potential saving of ${topAction ? formatINR(topAction.estimatedSavingMonthly) : '₹0'} per month.`
  }

  if (text.includes('top') && text.includes('action')) {
    return topAction
      ? `The top action is ${topAction.title} with an estimated saving of ${formatINR(topAction.estimatedSavingMonthly)} per month.`
      : 'No top action is available yet.'
  }

  if (text.includes('spend') || text.includes('waste')) {
    return `Your current session shows total spend of ${formatINR(session.totalSpend)} and total waste identified of ${formatINR(session.totalWaste)}.`
  }

  if (text.includes('vendor')) {
    return topFinding
      ? `The highest risk vendor is ${topFinding.title.split(' ')[0]} with ${formatINR(topFinding.deltaAmount)} monthly excess.`
      : 'There are no vendor-specific details available yet.'
  }

  return `I can answer basic spend questions based on the loaded session. For full AI chat, set OPENAI_API_KEY in your environment variables and reload the app.`
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatRequestBody {
  message: string
  sessionId: string
  history: ChatMessage[]
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as ChatRequestBody
    const { message, sessionId, history } = body

    if (!message || !sessionId) {
      return NextResponse.json({ error: 'message and sessionId are required' }, { status: 400 })
    }

    // Fetch session data to build context
    const session = await prisma.analysisSession.findUnique({ where: { id: sessionId } })
    if (!session) {
      const fallbackText = generateFallbackResponse(message, null, [], [])
      return new Response(createTextStream(fallbackText), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      })
    }

    const [findings, actions] = await Promise.all([
      prisma.finding.findMany({ where: { sessionId }, orderBy: { projectedAnnualWaste: 'desc' }, take: 10 }),
      prisma.actionLog.findMany({
        where: { finding: { sessionId } },
        orderBy: { priority: 'asc' },
        take: 5,
        include: { finding: true },
      }),
    ])

    const topFinding = findings[0]
    const uniqueDepts = Array.from(new Set(findings.map((f) => f.affectedDepartment).filter(Boolean)))
    const topVendors = Array.from(new Set(findings.map((f) => f.affectedVendor).filter(Boolean))).slice(0, 5)
    const totalSpend = session.totalSpend
    const totalWaste = session.totalWaste
    const overspendPct = session.overspendPct
    const findingsCount = findings.length

    const findingsDetail = findings
      .map((f) => `- ${f.title}: ₹${f.deltaAmount.toLocaleString('en-IN')}/mo waste, ${f.severity} severity, affects ${f.affectedDepartment ?? 'Unknown'}`)
      .join('\n')

    const topActionsText = actions.map((a) => a.title).join(', ')

    const systemPrompt = `You are Finci, an expert AI CFO assistant built into a cost intelligence platform. You have full access to the current expense analysis session.

SESSION DATA:
- Total spend: ₹${totalSpend.toLocaleString('en-IN')}
- Total waste identified: ₹${totalWaste.toLocaleString('en-IN')}
- Overspend percentage: ${overspendPct.toFixed(1)}%
- Number of anomalies found: ${findingsCount}
- Top finding: ${topFinding ? `${topFinding.title} — ₹${topFinding.deltaAmount.toLocaleString('en-IN')}/month waste` : 'None yet'}
- Top 3 recommended actions: ${topActionsText}
- Affected departments: ${uniqueDepts.join(', ')}
- Affected vendors: ${topVendors.join(', ')}

FINDINGS DETAIL:
${findingsDetail}

Answer questions concisely. Use ₹ Indian formatting. Be direct.
If asked about a specific vendor/department, give specific numbers.
Keep answers under 3 sentences unless a detailed breakdown is asked for.
Never say "I don't have access to" — you have all the data above.`

    // Limit history to last 10 messages
    const recentHistory = history.slice(-10)

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...recentHistory,
      { role: 'user', content: message },
    ]

    if (!openai) {
      const fallbackText = generateFallbackResponse(message, session, findings, actions)
      return new Response(createTextStream(fallbackText), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      })
    }

    const encoder = new TextEncoder()
    const openaiClient = openai

    try {
      const completion = await openaiClient!.chat.completions.create({
        model: OPENAI_MODEL,
        messages,
        stream: true,
        max_tokens: 500,
      })

      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of completion) {
              const delta = chunk.choices[0]?.delta?.content
              if (delta) {
                controller.enqueue(encoder.encode(delta))
              }
            }
          } catch (err) {
            controller.enqueue(encoder.encode(`\n\n[Error: ${err instanceof Error ? err.message : 'Unknown error'}]`))
          } finally {
            controller.close()
          }
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
          'Cache-Control': 'no-cache',
        },
      })
    } catch (err) {
      const fallbackText = generateFallbackResponse(message, session, findings, actions)
      return new Response(createTextStream(fallbackText), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      })
    }
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
