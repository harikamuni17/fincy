import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runAnalyzerAgent } from '@/agents/analyzerAgent'
import { runDecisionAgent } from '@/agents/decisionAgent'
import { runActionAgent } from '@/agents/actionAgent'
import { runForecastEngine } from '@/lib/forecastEngine'

function sseEvent(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId')
  if (!sessionId) {
    return new Response('sessionId is required', { status: 400 })
  }

  const session = await prisma.analysisSession.findUnique({ where: { id: sessionId } })
  if (!session) {
    return new Response('Session not found', { status: 404 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(sseEvent(data)))
      }

      try {
        await prisma.analysisSession.update({
          where: { id: sessionId },
          data: { status: 'ANALYZING' },
        })

        // ── Stage 1: Analyzer ───────────────────────────────────────────────
        send({ stage: 'analyzer', status: 'running', message: `Scanning ${session.totalRecords} transactions for anomalies...` })
        const analyzerResult = await runAnalyzerAgent(sessionId)
        send({
          stage: 'analyzer',
          status: 'complete',
          message: `Found ${analyzerResult.findingsCount} anomalies totaling ₹${analyzerResult.totalWaste.toLocaleString('en-IN')} waste`,
          count: analyzerResult.findingsCount,
        })

        // ── Stage 2: Decision ───────────────────────────────────────────────
        send({ stage: 'decision', status: 'running', message: 'Ranking optimal corrective actions...' })
        const decisionResult = await runDecisionAgent(sessionId)
        send({
          stage: 'decision',
          status: 'complete',
          message: `Generated ${decisionResult.actionsCount} prioritized actions`,
          count: decisionResult.actionsCount,
          data: decisionResult.topThreeActions,
        })

        // ── Stage 3: Action ─────────────────────────────────────────────────
        send({ stage: 'action', status: 'running', message: 'Executing autonomous actions...' })
        const actionResult = await runActionAgent(sessionId)
        send({
          stage: 'action',
          status: 'complete',
          message: `${actionResult.autoExecuted} auto-executed, ${actionResult.awaitingApproval} awaiting approval`,
          count: actionResult.awaitingApproval,
        })

        // ── Stage 4: Forecast ────────────────────────────────────────────────
        send({ stage: 'forecast', status: 'running', message: 'Projecting next 30-day risk...' })
        const forecastResult = await runForecastEngine(sessionId)
        send({
          stage: 'forecast',
          status: 'complete',
          message: forecastResult.alerts.length > 0
            ? `⚠️ ₹${forecastResult.nextMonthProjectedWaste.toLocaleString('en-IN')} projected waste next month`
            : 'No critical alerts — spend is trending within normal range',
          count: forecastResult.alerts.length,
        })

        // ── Finalize session ─────────────────────────────────────────────────
        const updatedSession = await prisma.analysisSession.update({
          where: { id: sessionId },
          data: { status: 'COMPLETE' },
        })

        const totalActions = await prisma.actionLog.count({
          where: { finding: { sessionId } },
        })

        const estimatedAnnualSavings = decisionResult.topThreeActions.reduce(
          (s, a) => s + a.savingAnnual,
          0,
        )

        send({
          stage: 'done',
          status: 'complete',
          message: 'Analysis complete',
          totalFindings: analyzerResult.findingsCount,
          totalActions,
          estimatedAnnualSavings: Math.round(estimatedAnnualSavings),
          totalWaste: analyzerResult.totalWaste,
          overspendPercent: analyzerResult.overspendPercent,
        })
      } catch (err) {
        console.error('[analyze SSE]', err)
        await prisma.analysisSession.update({
          where: { id: sessionId },
          data: { status: 'FAILED' },
        })
        send({ stage: 'analyzer', status: 'error', message: 'Analysis failed — please try again' })
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
