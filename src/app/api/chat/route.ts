import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { openai, OPENAI_MODEL } from '@/lib/openai'

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
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
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

    // Streaming response
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const completion = await openai.chat.completions.create({
            model: OPENAI_MODEL,
            messages,
            stream: true,
            max_tokens: 500,
          })

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
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
