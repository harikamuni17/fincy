import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { openai } from '@/lib/openai'

export async function POST(req: NextRequest) {
  const { findingId } = await req.json()

  if (!findingId) return NextResponse.json({ error: 'findingId required' }, { status: 400 })

  // Check for cached summary
  const existing = await prisma.agentReasoning.findUnique({ where: { findingId } })
  if (existing?.eli5Summary) {
    return NextResponse.json({ summary: existing.eli5Summary })
  }

  const finding = await prisma.finding.findUnique({ where: { id: findingId } })
  if (!finding) return NextResponse.json({ error: 'Finding not found' }, { status: 404 })

  const prompt = `You are a CFO assistant. Explain this financial finding in plain English (ELI5 style) in 2-3 sentences, as if explaining to a smart but non-technical executive. No jargon. Be direct and specific about the dollar impact.

Finding: ${finding.title}
Description: ${finding.description}
Potential saving: ₹${finding.projectedAnnualWaste?.toLocaleString('en-IN') ?? 'unknown'}/yr
Affected vendor: ${finding.affectedVendor ?? 'various'}
Department: ${finding.affectedDepartment ?? 'unknown'}

Respond with a single clear paragraph only.`

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 200,
  })

  const summary = completion.choices[0]?.message?.content?.trim() ?? ''

  // Cache to DB
  await prisma.agentReasoning.upsert({
    where: { findingId },
    update: { eli5Summary: summary },
    create: { findingId, steps: [], eli5Summary: summary },
  })

  return NextResponse.json({ summary })
}
