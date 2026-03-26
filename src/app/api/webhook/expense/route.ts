import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/webhook/expense — receive live transactions
export async function POST(req: NextRequest) {
  const body = await req.json()

  const vendor: string = String(body.vendor ?? 'Unknown')
  const amount: number = Number(body.amount ?? 0)
  const department: string = String(body.department ?? 'Unknown')
  const category: string = String(body.category ?? 'Other')
  const sessionId: string = String(body.sessionId ?? 'default')

  // Simple z-score style anomaly check: flag if > ₹50,000 single transaction
  const isAnomaly = amount > 50000 || Boolean(body.isAnomaly)
  const riskScore = Math.min(1, amount / 100000)

  const event = await prisma.liveFeedEvent.create({
    data: { sessionId, vendor, amount, department, category, isAnomaly, riskScore },
  })

  return NextResponse.json({ id: event.id, isAnomaly, riskScore })
}
