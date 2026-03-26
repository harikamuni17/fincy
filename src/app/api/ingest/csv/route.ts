import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseCSV } from '@/lib/csvParser'
import { parse as parseDate, isValid } from 'date-fns'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const text = await file.text()
    const rows = parseCSV(text)

    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty or has no valid rows' }, { status: 400 })
    }

    const totalSpend = rows.reduce((s, r) => s + r.amount, 0)

    const session = await prisma.analysisSession.create({
      data: {
        sourceType: 'CSV',
        fileName: file.name,
        totalRecords: rows.length,
        totalSpend: Math.round(totalSpend),
      },
    })

    // Batch insert expenses
    const chunkSize = 100
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize)
      await prisma.expense.createMany({
        data: chunk.map((r) => {
          let date = parseDate(r.date, 'dd/MM/yyyy', new Date())
          if (!isValid(date)) date = parseDate(r.date, 'yyyy-MM-dd', new Date())
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
      sourceType: 'CSV',
    })
  } catch (err) {
    console.error('[ingest/csv]', err)
    return NextResponse.json({ error: 'Failed to process CSV file' }, { status: 500 })
  }
}
