export const BENCHMARKS = {
  byCategory: {
    Infrastructure: { small: 42000,  medium: 95000,  large: 280000 },
    SaaS:           { small: 28000,  medium: 68000,  large: 180000 },
    Travel:         { small: 18000,  medium: 45000,  large: 120000 },
    Marketing:      { small: 35000,  medium: 85000,  large: 220000 },
    Logistics:      { small: 22000,  medium: 55000,  large: 140000 },
    Office:         { small: 12000,  medium: 28000,  large: 75000  },
    Cloud:          { small: 42000,  medium: 95000,  large: 280000 },
    CRM:            { small: 20000,  medium: 45000,  large: 120000 },
    'Design Tools': { small: 8000,   medium: 18000,  large: 45000  },
  } as Record<string, { small: number; medium: number; large: number }>,

  byVendor: {
    AWS:                  { monthly: 68000, note: 'Median for 50-200 employee SaaS companies' },
    Zoom:                 { monthly: 8500,  note: 'Per 100 seats industry standard' },
    Slack:                { monthly: 12000, note: 'Per 100 active users' },
    Salesforce:           { monthly: 45000, note: 'Enterprise CRM median' },
    'Google Workspace':   { monthly: 9000,  note: 'Per 100 users' },
    Figma:                { monthly: 6500,  note: 'Per 50 design seats' },
    'Microsoft 365':      { monthly: 7500,  note: 'Per 100 users' },
    HubSpot:              { monthly: 22000, note: 'Growth tier median' },
    Jira:                 { monthly: 5500,  note: 'Per 50 seats' },
    Notion:               { monthly: 4000,  note: 'Per 50 users' },
  } as Record<string, { monthly: number; note: string }>,

  sourceLabel: 'Based on 2024 Indian SaaS & Enterprise benchmarks',
}

export function getBenchmark(
  category: string,
  employeeCount: number,
  yourSpend: number,
): { median: number; percentAbove: number; verdict: string; tier: 'small' | 'medium' | 'large' } {
  const tier: 'small' | 'medium' | 'large' =
    employeeCount < 50 ? 'small' : employeeCount < 200 ? 'medium' : 'large'

  const catData = BENCHMARKS.byCategory[category]
  const median = catData ? catData[tier] : 50000

  const percentAbove = median > 0 ? Math.round(((yourSpend - median) / median) * 100) : 0

  let verdict: string
  if (percentAbove > 100) verdict = `${percentAbove}% above peer median — significant overrun`
  else if (percentAbove > 30) verdict = `${percentAbove}% above peer median — worth reviewing`
  else if (percentAbove > 0) verdict = `${percentAbove}% above peer median — acceptable`
  else verdict = `${Math.abs(percentAbove)}% below peer median — well optimized`

  return { median, percentAbove, verdict, tier }
}
