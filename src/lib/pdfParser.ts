import pdfParse from 'pdf-parse'
import type { ParsedExpenseRow } from './csvParser'

/**
 * Extract expense rows from a bank statement PDF.
 * Parses common bank statement table formats.
 */
export async function parsePDF(buffer: Buffer): Promise<ParsedExpenseRow[]> {
  const data = await pdfParse(buffer)
  const lines = data.text.split('\n').map((l) => l.trim()).filter(Boolean)

  const rows: ParsedExpenseRow[] = []

  // Regex patterns for common statement formats
  // Date patterns: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
  const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{2}[\/\-]\d{2})/
  // Amount pattern: optional ₹, digits with optional commas, optional decimal
  const amountPattern = /₹?\s?(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)/g

  for (const line of lines) {
    const dateMatch = line.match(datePattern)
    if (!dateMatch) continue

    const amounts: number[] = []
    let match: RegExpExecArray | null
    while ((match = amountPattern.exec(line)) !== null) {
      const val = parseFloat(match[1].replace(/,/g, ''))
      if (!isNaN(val) && val > 0) amounts.push(val)
    }
    amountPattern.lastIndex = 0

    if (amounts.length === 0) continue

    // Take the largest amount as the transaction value
    const amount = Math.max(...amounts)
    // Remove date and amounts from line to extract vendor description
    const vendor = line
      .replace(datePattern, '')
      .replace(/₹?\s?\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 60) || 'Unknown Vendor'

    rows.push({
      date: dateMatch[1],
      vendor,
      amount,
      category: classifyVendor(vendor),
      department: 'Operations',
      description: line.substring(0, 120),
    })
  }

  return rows
}

function classifyVendor(vendor: string): string {
  const lower = vendor.toLowerCase()
  if (/aws|azure|gcp|cloud/.test(lower)) return 'Cloud'
  if (/slack|zoom|notion|figma|hubspot|salesforce/.test(lower)) return 'SaaS'
  if (/flight|hotel|travel|mmt|makemytrip|oyo/.test(lower)) return 'Travel'
  if (/electricity|eb|bescom|tneb|bses/.test(lower)) return 'Utilities'
  if (/maintenance|repair|service/.test(lower)) return 'Maintenance'
  if (/supply|material|logistics|freight/.test(lower)) return 'Supplies'
  return 'General'
}
