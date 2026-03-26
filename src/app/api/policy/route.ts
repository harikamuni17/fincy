import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/policy
export async function GET() {
  const policies = await prisma.policy.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(policies)
}

// POST /api/policy
export async function POST(req: NextRequest) {
  const body = await req.json()

  const policy = await prisma.policy.create({
    data: {
      name: String(body.name),
      description: body.description ? String(body.description) : undefined,
      condition: body.condition,
      field: String(body.field),
      operator: String(body.operator),
      threshold: body.threshold !== undefined ? Number(body.threshold) : undefined,
      listValues: Array.isArray(body.listValues) ? body.listValues.map(String) : [],
      action: body.action,
      isActive: body.isActive !== false,
    },
  })

  return NextResponse.json(policy, { status: 201 })
}

// PATCH /api/policy — toggle isActive
export async function PATCH(req: NextRequest) {
  const { id, isActive } = await req.json()
  const updated = await prisma.policy.update({ where: { id }, data: { isActive } })
  return NextResponse.json(updated)
}

// DELETE /api/policy
export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await prisma.policy.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
