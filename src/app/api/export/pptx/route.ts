import { NextRequest, NextResponse } from 'next/server'
import { buildPPTX } from '@/lib/pptxExporter'

export async function POST(req: NextRequest) {
  const body = await req.json()

  try {
    const buf = await buildPPTX({
      companyName: body.companyName ?? 'Company',
      analysisDate: body.analysisDate,
      totalWaste: Number(body.totalWaste ?? 0),
      totalSpend: Number(body.totalSpend ?? 0),
      overspendPct: Number(body.overspendPct ?? 0),
      annualSavingsIfActed: Number(body.annualSavingsIfActed ?? 0),
      topActions: body.topActions ?? [],
      score: Number(body.score ?? 50),
      grade: body.grade ?? 'C',
      nextMonthForecast: body.nextMonthForecast ? Number(body.nextMonthForecast) : undefined,
    })

    return new NextResponse(buf as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="finci-board-report-${Date.now()}.pptx"`,
      },
    })
  } catch (err) {
    console.error('PPTX generation failed:', err)
    return NextResponse.json({ error: 'PPTX generation failed' }, { status: 500 })
  }
}
