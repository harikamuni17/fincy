export interface YearlyBreakdown {
  year: number
  saving: number
  compounded: number
  total: number
}

export interface CompoundResult {
  yearlyBreakdown: YearlyBreakdown[]
  totalRecovered: number
  totalCompoundGain: number
  effectiveMultiplier: number
}

export function calculateCompoundSavings(params: {
  annualSaving: number
  years?: number
  reinvestmentRate?: number
}): CompoundResult {
  const { annualSaving, years = 3, reinvestmentRate = 0.12 } = params

  const yearlyBreakdown: YearlyBreakdown[] = []
  let runningTotal = 0
  let totalCompoundGain = 0

  for (let y = 1; y <= years; y++) {
    const compounded = runningTotal * reinvestmentRate
    runningTotal += annualSaving + compounded
    totalCompoundGain += compounded
    yearlyBreakdown.push({
      year: y,
      saving: annualSaving,
      compounded: Math.round(compounded),
      total: Math.round(runningTotal),
    })
  }

  const totalRecovered = Math.round(runningTotal)
  const effectiveMultiplier = annualSaving > 0
    ? Math.round((totalRecovered / (annualSaving * years)) * 100) / 100
    : 0

  return { yearlyBreakdown, totalRecovered, totalCompoundGain: Math.round(totalCompoundGain), effectiveMultiplier }
}

export function getEquivalentLabel(totalRecovered: number): string {
  if (totalRecovered < 1000000)  return 'a full product launch budget'
  if (totalRecovered < 2500000)  return '2 years of senior engineering salaries'
  if (totalRecovered < 5000000)  return 'a Series A runway extension of 3 months'
  return 'a complete department expansion'
}
