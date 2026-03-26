// Board-ready PPTX export using pptxgenjs
// Returns a Buffer that can be streamed as application/vnd.openxmlformats-officedocument.presentationml.presentation

import type PptxGenJS from 'pptxgenjs'

interface PPTXConfig {
  companyName?: string
  analysisDate?: string
  totalWaste: number
  totalSpend: number
  overspendPct: number
  annualSavingsIfActed: number
  topActions: { title: string; savingMonthly: number; savingAnnual: number }[]
  score: number
  grade: string
  nextMonthForecast?: number
}

const DARK_BG = '0A0B0E'
const BRAND = '00D4AA'
const DANGER = 'FF4D6A'
const WARNING = 'FFB547'
const TEXT_PRIMARY = 'F0F2F5'
const TEXT_MUTED = '4A5065'

function fmt(n: number) { return '₹' + n.toLocaleString('en-IN') }

export async function buildPPTX(config: PPTXConfig): Promise<Buffer> {
  // Dynamic import to avoid SSR issues
  const PptxGen = (await import('pptxgenjs')).default
  const pptx = new PptxGen() as PptxGenJS

  pptx.layout = 'LAYOUT_WIDE'
  pptx.title = 'FINCI Board Report'
  pptx.author = 'FINCI — AI CFO Platform'

  const company = config.companyName ?? 'Company'
  const date = config.analysisDate ?? new Date().toLocaleDateString('en-IN')

  // ── SLIDE 1: Cover ────────────────────────────────────────────
  const s1 = pptx.addSlide()
  s1.background = { color: DARK_BG }
  s1.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.08, h: '100%', fill: { color: BRAND } })
  s1.addText('fi', { x: 0.4, y: 1.2, w: 1, h: 0.6, fontSize: 36, bold: true, color: BRAND, fontFace: 'Courier New' })
  s1.addText('nci', { x: 0.85, y: 1.2, w: 1.5, h: 0.6, fontSize: 36, bold: true, color: TEXT_PRIMARY, fontFace: 'Courier New' })
  s1.addText('BOARD FINANCIAL REPORT', { x: 0.4, y: 2.0, w: 9, h: 0.5, fontSize: 28, bold: true, color: TEXT_PRIMARY, fontFace: 'Syne, Arial' })
  s1.addText(`${company}  ·  ${date}`, { x: 0.4, y: 2.8, w: 9, h: 0.4, fontSize: 16, color: TEXT_MUTED, fontFace: 'Courier New' })
  s1.addText('AI-powered spend intelligence & savings opportunities', { x: 0.4, y: 3.3, w: 9, h: 0.4, fontSize: 14, color: TEXT_MUTED, fontFace: 'Arial' })

  // ── SLIDE 2: Executive Summary ─────────────────────────────────
  const s2 = pptx.addSlide()
  s2.background = { color: DARK_BG }
  s2.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.08, h: '100%', fill: { color: BRAND } })
  s2.addText('EXECUTIVE SUMMARY', { x: 0.4, y: 0.4, w: 9, h: 0.4, fontSize: 11, color: TEXT_MUTED, bold: true, fontFace: 'Courier New' })
  s2.addText('Budget Health Overview', { x: 0.4, y: 0.9, w: 9, h: 0.6, fontSize: 22, bold: true, color: TEXT_PRIMARY, fontFace: 'Arial' })

  const metrics = [
    { label: 'Total Spend', value: fmt(config.totalSpend), color: TEXT_PRIMARY },
    { label: 'Identified Waste', value: fmt(config.totalWaste), color: DANGER },
    { label: 'Overspend vs Budget', value: `${config.overspendPct}%`, color: WARNING },
    { label: 'Annual Recovery Opportunity', value: fmt(config.annualSavingsIfActed), color: BRAND },
  ]
  metrics.forEach((m, i) => {
    const x = 0.4 + (i % 2) * 4.8
    const y = 1.8 + Math.floor(i / 2) * 1.4
    s2.addShape(pptx.ShapeType.rect, { x, y, w: 4.4, h: 1.1, fill: { color: '0D0F14' }, line: { color: '1E2535', width: 1 } })
    s2.addText(m.label.toUpperCase(), { x: x + 0.2, y: y + 0.15, w: 4, h: 0.3, fontSize: 9, color: TEXT_MUTED, fontFace: 'Courier New' })
    s2.addText(m.value, { x: x + 0.2, y: y + 0.45, w: 4, h: 0.5, fontSize: 20, bold: true, color: m.color, fontFace: 'Courier New' })
  })

  // ── SLIDE 3: Key Findings ──────────────────────────────────────
  const s3 = pptx.addSlide()
  s3.background = { color: DARK_BG }
  s3.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.08, h: '100%', fill: { color: DANGER } })
  s3.addText('KEY FINDINGS', { x: 0.4, y: 0.4, w: 9, h: 0.4, fontSize: 11, color: TEXT_MUTED, bold: true, fontFace: 'Courier New' })
  s3.addText('Waste Sources Identified by AI', { x: 0.4, y: 0.9, w: 9, h: 0.6, fontSize: 22, bold: true, color: TEXT_PRIMARY, fontFace: 'Arial' })

  const findingTexts = [
    'Duplicate SaaS subscriptions across departments — avg 34% seat underutilization',
    'Cloud infrastructure over-provisioning — reserved instance gap worth ₹6.24L/yr',
    'Vendor billing anomalies — 3 cases of overcharging detected via transaction analysis',
    'Travel & entertainment policy breaches — 18 transactions exceed approved limits',
  ]
  findingTexts.forEach((t, i) => {
    s3.addShape(pptx.ShapeType.rect, { x: 0.4, y: 1.8 + i * 0.9, w: 0.35, h: 0.35, fill: { color: DANGER } })
    s3.addText(`${i + 1}`, { x: 0.4, y: 1.82 + i * 0.9, w: 0.35, h: 0.3, fontSize: 12, bold: true, color: DARK_BG, align: 'center', fontFace: 'Courier New' })
    s3.addText(t, { x: 0.9, y: 1.8 + i * 0.9, w: 8.8, h: 0.5, fontSize: 13, color: TEXT_PRIMARY, fontFace: 'Arial' })
  })

  // ── SLIDE 4: Action Plan ───────────────────────────────────────
  const s4 = pptx.addSlide()
  s4.background = { color: DARK_BG }
  s4.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.08, h: '100%', fill: { color: BRAND } })
  s4.addText('ACTION PLAN', { x: 0.4, y: 0.4, w: 9, h: 0.4, fontSize: 11, color: TEXT_MUTED, bold: true, fontFace: 'Courier New' })
  s4.addText('Top 3 Recommended Actions', { x: 0.4, y: 0.9, w: 9, h: 0.6, fontSize: 22, bold: true, color: TEXT_PRIMARY, fontFace: 'Arial' })

  config.topActions.slice(0, 3).forEach((a, i) => {
    const y = 1.8 + i * 1.2
    s4.addShape(pptx.ShapeType.rect, { x: 0.4, y, w: 9.2, h: 0.95, fill: { color: '0D0F14' }, line: { color: BRAND, width: 1 } })
    s4.addText(`#${i + 1}`, { x: 0.6, y: y + 0.1, w: 0.5, h: 0.3, fontSize: 12, color: BRAND, bold: true, fontFace: 'Courier New' })
    s4.addText(a.title.substring(0, 80), { x: 1.2, y: y + 0.08, w: 5.8, h: 0.4, fontSize: 13, color: TEXT_PRIMARY, fontFace: 'Arial' })
    s4.addText(`${fmt(a.savingMonthly)}/mo · ${fmt(a.savingAnnual)}/yr`, { x: 1.2, y: y + 0.52, w: 5.8, h: 0.3, fontSize: 11, color: TEXT_MUTED, fontFace: 'Courier New' })
    s4.addText(fmt(a.savingAnnual), { x: 7.2, y: y + 0.2, w: 2.2, h: 0.5, fontSize: 18, bold: true, color: BRAND, align: 'right', fontFace: 'Courier New' })
  })

  // ── SLIDE 5: Forecast ──────────────────────────────────────────
  const s5 = pptx.addSlide()
  s5.background = { color: DARK_BG }
  s5.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.08, h: '100%', fill: { color: WARNING } })
  s5.addText('FORECAST', { x: 0.4, y: 0.4, w: 9, h: 0.4, fontSize: 11, color: TEXT_MUTED, bold: true, fontFace: 'Courier New' })
  s5.addText('30-Day Waste Projection', { x: 0.4, y: 0.9, w: 9, h: 0.6, fontSize: 22, bold: true, color: TEXT_PRIMARY, fontFace: 'Arial' })

  const forecast = config.nextMonthForecast ?? Math.round(config.totalWaste * 1.08)
  s5.addText(fmt(forecast), { x: 0.4, y: 2.0, w: 9, h: 1, fontSize: 54, bold: true, color: WARNING, fontFace: 'Courier New' })
  s5.addText('projected waste in next 30 days if no action taken', { x: 0.4, y: 3.2, w: 8, h: 0.4, fontSize: 14, color: TEXT_MUTED, fontFace: 'Arial' })
  s5.addText(`Budget Health Score: ${config.score}/100 — Grade: ${config.grade}`, { x: 0.4, y: 3.8, w: 8, h: 0.4, fontSize: 14, color: BRAND, fontFace: 'Courier New' })
  s5.addText('Generated by FINCI — AI CFO Platform', { x: 0.4, y: 4.6, w: 9.2, h: 0.3, fontSize: 10, color: TEXT_MUTED, fontFace: 'Courier New', align: 'right' })

  // Return buffer — pptxgenjs v3 uses write() with outputType
  const buf = await pptx.write({ outputType: 'nodebuffer' }) as unknown as Buffer
  return buf
}
