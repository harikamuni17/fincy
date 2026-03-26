import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parsePDF } from '@/lib/pdfParser'
import { parse as parseDate, isValid } from 'date-fns'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const rows = await parsePDF(buffer)

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'No transactions found in PDF. Ensure this is a bank statement.' },
        { status: 400 },
      )
    }

    const totalSpend = rows.reduce((s, r) => s + r.amount, 0)

    const session = await prisma.analysisSession.create({
      data: {
        sourceType: 'PDF_BANK_STATEMENT',
        fileName: file.name,
        totalRecords: rows.length,
        totalSpend: Math.round(totalSpend),
      },
    })

    const chunkSize = 100
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize)
      await prisma.expense.createMany({
        data: chunk.map((r) => {
          let date = parseDate(r.date, 'dd/MM/yyyy', new Date())
          if (!isValid(date)) date = parseDate(r.date, 'dd-MM-yyyy', new Date())
          if (!isValid(date)) date = new Date()
          return {
            sessionId: session.id,
            date,
            vendor: r.vendor.substring(0, 120),
            amount: r.amount,
            category: r.category,
            department: r.department,
            description: r.description?.substring(0, 500),
          }
        }),
      })
    }

    return NextResponse.json({
      sessionId: session.id,
      recordCount: rows.length,
      totalSpend: Math.round(totalSpend),
      sourceType: 'PDF_BANK_STATEMENT',
    })
  } catch (err) {
    console.error('[ingest/pdf]', err)
    return NextResponse.json({ error: 'Failed to process PDF file' }, { status: 500 })
  }
}
