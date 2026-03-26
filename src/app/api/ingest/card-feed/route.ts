import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { subMonths, startOfMonth, addDays } from 'date-fns'

function randomBetween(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min))
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

export async function POST() {
  try {
    const now = new Date()
    const months = [
      { start: startOfMonth(subMonths(now, 2)), end: startOfMonth(subMonths(now, 1)) },
      { start: startOfMonth(subMonths(now, 1)), end: startOfMonth(now) },
      { start: startOfMonth(now), end: addDays(startOfMonth(now), 25) },
    ]

    // SaaS vendor spend per month (baseline and anomaly values)
    const vendors = [
      { vendor: 'AWS', category: 'Cloud', dept: 'Engineering', base: [42000, 41500], anomaly: 117600 },
      { vendor: 'Zoom', category: 'SaaS', dept: 'Operations', base: [18000, 17500], anomaly: 18200 },
      { vendor: 'Slack', category: 'SaaS', dept: 'Operations', base: [44000, 46000], anomaly: 47500 },
      { vendor: 'Notion', category: 'SaaS', dept: 'Product', base: [8500, 8500], anomaly: 8700 },
      { vendor: 'Figma', category: 'Design Tools', dept: 'Design', base: [24000, 24000], anomaly: 24000 },
      { vendor: 'HubSpot', category: 'CRM', dept: 'Sales', base: [32000, 33000], anomaly: 34000 },
      { vendor: 'Salesforce', category: 'CRM', dept: 'Sales', base: [48000, 49000], anomaly: 50000 },
      { vendor: 'Google Workspace', category: 'Productivity', dept: 'Operations', base: [12000, 12000], anomaly: 12500 },
      { vendor: 'TechSoft Pro', category: 'SaaS', dept: 'Engineering', base: [12000, 12000], anomaly: 12000 },
    ]

    const allExpenses: {
      vendor: string; category: string; department: string;
      amount: number; date: Date; description: string; isAnomaly: boolean
    }[] = []

    for (let mi = 0; mi < 3; mi++) {
      const { start, end } = months[mi]

      for (const v of vendors) {
        const amount = mi < 2 ? (v.base[mi] ?? v.base[0]) : v.anomaly
        const isAnomaly = mi === 2 && v.vendor === 'AWS'

        allExpenses.push({
          vendor: v.vendor,
          category: v.category,
          department: v.dept,
          amount,
          date: randomDate(start, end),
          description: `${v.vendor} monthly subscription`,
          isAnomaly,
        })

        // Anomaly 2: TechSoft Pro annual billing in month 3
        if (v.vendor === 'TechSoft Pro' && mi === 2) {
          allExpenses.push({
            vendor: 'TechSoft Pro',
            category: 'SaaS',
            department: 'Engineering',
            amount: 120000,
            date: randomDate(start, end),
            description: 'Annual subscription renewal — TechSoft Pro',
            isAnomaly: true,
          })
        }
      }

      // Anomaly 3: Sales travel
      const travelAmounts = [18000, 21000, 82000]
      allExpenses.push({
        vendor: 'MakeMyTrip Corporate',
        category: 'Travel',
        department: 'Sales',
        amount: travelAmounts[mi],
        date: randomDate(start, end),
        description: 'Sales team travel expenses',
        isAnomaly: mi === 2,
      })

      // Anomaly 4: Unused SaaS licenses (represented as normal spend with metadata)
      const unusedTools = [
        { vendor: 'Asana', base: 18000 },
        { vendor: 'Miro', base: 9500 },
      ]
      for (const ut of unusedTools) {
        allExpenses.push({
          vendor: ut.vendor,
          category: 'SaaS',
          department: 'Product',
          amount: ut.base,
          date: randomDate(start, end),
          description: `${ut.vendor} team subscription`,
          isAnomaly: false,
        })
      }

      // Background transactions (misc office expenses)
      for (let i = 0; i < 15; i++) {
        allExpenses.push({
          vendor: ['Swiggy Business', 'Urban Company', 'Amazon Business', 'Flipkart Commerce'][i % 4],
          category: 'Office',
          department: ['HR', 'Admin', 'Finance', 'Operations'][i % 4],
          amount: randomBetween(800, 8000),
          date: randomDate(start, end),
          description: 'Office expense',
          isAnomaly: false,
        })
      }
    }

    const totalSpend = allExpenses.reduce((s, e) => s + e.amount, 0)

    const session = await prisma.analysisSession.create({
      data: {
        sourceType: 'CARD_FEED',
        fileName: 'corporate_card_feed_live.json',
        totalRecords: allExpenses.length,
        totalSpend: Math.round(totalSpend),
        status: 'PENDING',
      },
    })

    // Insert in chunks
    const chunkSize = 50
    for (let i = 0; i < allExpenses.length; i += chunkSize) {
      const chunk = allExpenses.slice(i, i + chunkSize)
      await prisma.expense.createMany({
        data: chunk.map((e) => ({
          sessionId: session.id,
          date: e.date,
          vendor: e.vendor,
          amount: e.amount,
          category: e.category,
          department: e.department,
          description: e.description,
          isAnomaly: e.isAnomaly,
        })),
      })
    }

    return NextResponse.json({
      sessionId: session.id,
      recordCount: allExpenses.length,
      totalSpend: Math.round(totalSpend),
      sourceType: 'CARD_FEED',
    })
  } catch (err) {
    console.error('[ingest/card-feed]', err)
    return NextResponse.json({ error: 'Failed to generate card feed data' }, { status: 500 })
  }
}
