import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const findingId = req.nextUrl.searchParams.get('findingId')
  if (!findingId) return NextResponse.json({ error: 'findingId required' }, { status: 400 })

  const reasoning = await prisma.agentReasoning.findUnique({ where: { findingId } })
  if (!reasoning) return NextResponse.json({ steps: [], eli5Summary: '' })

  return NextResponse.json({
    steps: reasoning.steps,
    eli5Summary: reasoning.eli5Summary,
  })
}
