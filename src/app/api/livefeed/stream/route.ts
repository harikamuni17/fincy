import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/livefeed/stream?sessionId=xxx — SSE stream of live events
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId') ?? 'default'

  let lastId = ''

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      function send(data: string) {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        } catch {}
      }

      // Poll every 2 seconds and emit new events
      async function poll() {
        const events = await prisma.liveFeedEvent.findMany({
          where: {
            sessionId,
            ...(lastId ? { id: { gt: lastId } } : {}),
          },
          orderBy: { receivedAt: 'asc' },
          take: 10,
        })

        for (const e of events) {
          send(JSON.stringify({
            id: e.id,
            vendor: e.vendor,
            amount: e.amount,
            department: e.department,
            category: e.category,
            isAnomaly: e.isAnomaly,
            riskScore: e.riskScore,
            receivedAt: e.receivedAt,
          }))
          lastId = e.id
        }
      }

      // Initial ping
      controller.enqueue(encoder.encode(': connected\n\n'))

      // Poll loop — 60 iterations × 2s = 2 min max
      for (let i = 0; i < 60; i++) {
        await new Promise(res => setTimeout(res, 2000))
        try { await poll() } catch { break }
      }

      try { controller.close() } catch {}
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
