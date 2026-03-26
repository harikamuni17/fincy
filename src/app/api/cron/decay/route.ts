import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateDecayedConfidence } from '@/lib/confidenceDecay'

// GET /api/cron/decay — called by cron job or manual trigger
// Updates AgentReasoning confidence tracking; marks stale findings
export async function GET() {
  const findings = await prisma.finding.findMany({ select: { id: true, confidenceScore: true, createdAt: true } })

  let updated = 0
  for (const f of findings) {
    const { currentConfidence, isStale } = calculateDecayedConfidence({
      originalConfidence: f.confidenceScore,
      createdAt: f.createdAt,
    })
    if (isStale && Math.abs(currentConfidence - f.confidenceScore) > 0.01) {
      await prisma.finding.update({
        where: { id: f.id },
        data: { confidenceScore: currentConfidence },
      })
      updated++
    }
  }

  return NextResponse.json({ processed: findings.length, updated })
}
