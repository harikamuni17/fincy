import {
  User,
  Finding,
  ActionLog,
  Expense,
  AnalysisSession,
  Simulation,
  ForecastRecord,
  ROIRecord,
  TicketLog,
} from '@prisma/client'

export type {
  User,
  Finding,
  ActionLog,
  Expense,
  AnalysisSession,
  Simulation,
  ForecastRecord,
  ROIRecord,
  TicketLog,
}

export interface CalculationStep {
  step: string
  value: number
  unit: 'INR' | 'percent' | 'count' | 'zscore' | 'months'
  explanation: string
}

export interface ActionRecommendation {
  title: string
  description: string
  actionType: string
  estimatedSavingMonthly: number
  estimatedSavingAnnual: number
  confidenceScore: number
  dollarThreshold: number
  priority: number
}

export interface AgentEvent {
  stage: 'analyzer' | 'decision' | 'action' | 'monitor' | 'forecast' | 'done'
  status: 'running' | 'complete' | 'error'
  message: string
  count?: number
  data?: unknown
}

export interface CFOSummary {
  totalSpend: number
  totalWaste: number
  overspendPercent: number
  topWasteCategory: string
  annualSavingsIfActed: number
  topThreeActions: TopAction[]
  forecastAlerts: string[]
}

export interface TopAction {
  rank: number
  title: string
  savingMonthly: number
  savingAnnual: number
  confidence: number
}

export interface SimulationResult {
  scenarioName: string
  baselineData: MonthlyDataPoint[]
  projectedData: MonthlyDataPoint[]
  saving3m: number
  saving12m: number
  breakEvenMonths: number
}

export interface MonthlyDataPoint {
  month: string
  amount: number
  isForecast: boolean
}

export interface ForecastAlert {
  message: string
  predictedLoss: number
  daysUntil: number
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export interface DashboardData {
  session: AnalysisSession | null
  cfoSummary: CFOSummary | null
  recentFindings: Finding[]
  pendingActions: ActionLog[]
  forecasts: ForecastRecord[]
}
