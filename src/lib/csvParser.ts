import { parse } from 'csv-parse/sync'

export interface ParsedExpenseRow {
  date: string
  vendor: string
  amount: number
  category: string
  department: string
  description?: string
}

/**
 * Parse CSV content into expense rows.
 * Supports flexible column names (case-insensitive).
 */
export function parseCSV(content: string): ParsedExpenseRow[] {
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[]

  return records.map((row, idx) => {
    const keys = Object.fromEntries(
      Object.entries(row).map(([k, v]) => [k.toLowerCase().trim(), v]),
    )

    const dateStr = keys['date'] ?? keys['transaction_date'] ?? keys['txn_date'] ?? ''
    const vendor  = keys['vendor'] ?? keys['merchant'] ?? keys['payee'] ?? `Unknown-${idx}`
    const rawAmt  = keys['amount'] ?? keys['debit'] ?? keys['cost'] ?? '0'
    const amount  = parseFloat(rawAmt.replace(/[₹,\s]/g, '')) || 0
    const category   = keys['category'] ?? keys['type'] ?? 'Uncategorized'
    const department = keys['department'] ?? keys['dept'] ?? keys['team'] ?? 'General'
    const description = keys['description'] ?? keys['notes'] ?? keys['memo'] ?? undefined

    return { date: dateStr, vendor, amount, category, department, description }
  })
}
