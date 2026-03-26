'use client'

import { useState, useEffect, useCallback } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import CFOHeroBanner from '@/components/layout/CFOHeroBanner'
import MetricCard from '@/components/cards/MetricCard'
import SpendTrendChart from '@/components/charts/SpendTrendChart'
import CategoryDonutChart from '@/components/charts/CategoryDonutChart'
import PrioritizedActionsList from '@/components/PrioritizedActionsList'
import DataSourcesPanel from '@/components/DataSourcesPanel'
import ForecastAlertCard from '@/components/cards/ForecastAlertCard'
import AgentProgressTracker from '@/components/AgentProgressTracker'
import WasteTicker from '@/components/WasteTicker'
import BudgetHealthScore from '@/components/BudgetHealthScore'
import OptimizeNowModal from '@/components/OptimizeNowModal'
import SavingsLeaderboard from '@/components/SavingsLeaderboard'
import LiveFeedPanel from '@/components/LiveFeedPanel'
import ShareableScoreCard from '@/components/ShareableScoreCard'
import { calculateHealthScore } from '@/lib/savingsCalculator'
import type { CFOSummary, ForecastRecord, TopAction, MonthlyDataPoint, ActionLog } from '@/types'
import type { AnalysisSession } from '@prisma/client'

interface DashboardState {
  session: AnalysisSession | null
  cfoSummary: CFOSummary | null
  spendTrend: MonthlyDataPoint[]
  categoryData: { category: string; amount: number }[]
  forecasts: ForecastRecord[]
  pendingCount: number
  isAnalyzing: boolean
  analyzeSessionId: string | null
  allActions: ActionLog[]
}

function buildCFOSummary(
  session: AnalysisSession,
  topActions: TopAction[],
  forecastAlerts: string[],
): CFOSummary {
  return {
    totalSpend: session.totalSpend,
    totalWaste: session.totalWaste,
    overspendPercent: session.overspendPct,
    topWasteCategory: 'underutilized SaaS tools',
    annualSavingsIfActed: topActions.reduce((s, a) => s + a.savingAnnual, 0),
    topThreeActions: topActions.slice(0, 3),
    forecastAlerts,
  }
}

export default function DashboardPage() {
  const [state, setState] = useState<DashboardState>({
    session: null,
    cfoSummary: null,
    spendTrend: [],
    categoryData: [],
    forecasts: [],
    pendingCount: 0,
    isAnalyzing: false,
    analyzeSessionId: null,
    allActions: [],
  })
  const [showOptimize, setShowOptimize] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadSessionData = useCallback(async (sessionId: string) => {
    try {
      const [sessRes, actionsRes, forecastRes] = await Promise.all([
        fetch(`/api/actions?sessionId=${sessionId}`),
        fetch(`/api/actions?sessionId=${sessionId}&status=AWAITING_MANAGER`),
        fetch(`/api/forecast?sessionId=${sessionId}`),
      ])

      const actData  = await actionsRes.json() as { actions: { priority: number; title: string; estimatedSavingMonthly: number; estimatedSavingAnnual: number; status: string }[] }
      const foreData = await forecastRes.json() as { forecasts: ForecastRecord[]; nextMonthProjectedWaste?: number }

      const topActions: TopAction[] = (actData.actions ?? [])
        .sort((a, b) => a.priority - b.priority)
        .slice(0, 3)
        .map((a, i) => ({
          rank: i + 1,
          title: a.title,
          savingMonthly: a.estimatedSavingMonthly,
          savingAnnual: a.estimatedSavingAnnual,
          confidence: 0.87,
        }))

      const alerts = (foreData.forecasts ?? [])
        .filter((f: ForecastRecord) => (f as unknown as { isAlert: boolean }).isAlert)
        .map((f: ForecastRecord) => (f as unknown as { alertMessage: string }).alertMessage)
        .slice(0, 2)

      const allActionsData = (await (await fetch(`/api/actions?sessionId=${sessionId}`)).json() as { actions: ActionLog[] }).actions ?? []
      const pendingCount = allActionsData.filter(
        (a: ActionLog) => ['AWAITING_MANAGER', 'AWAITING_DIRECTOR', 'AWAITING_CFO'].includes(a.status),
      ).length

      setState((prev) => {
        if (!prev.session) return prev
        return {
          ...prev,
          cfoSummary: buildCFOSummary(prev.session, topActions, alerts),
          forecasts: foreData.forecasts ?? [],
          pendingCount,
          allActions: allActionsData,
        }
      })
    } catch (err) {
      console.error('Failed to load session data:', err)
    }
  }, [])

  async function handleLoadDemo() {
    setLoading(true)
    try {
      const res = await fetch('/api/ingest/card-feed', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to load demo data')
      const data = await res.json() as { sessionId: string; recordCount: number; totalSpend: number }

      const mockSession = {
        id: data.sessionId,
        createdAt: new Date(),
        status: 'PENDING' as const,
        sourceType: 'CARD_FEED' as const,
        fileName: 'corporate_card_feed_live.json',
        totalRecords: data.recordCount,
        totalSpend: data.totalSpend,
        totalWaste: 0,
        overspendPct: 0,
      }

      setState((prev) => ({
        ...prev,
        session: mockSession,
        analyzeSessionId: data.sessionId,
        isAnalyzing: true,
        categoryData: [
          { category: 'Cloud', amount: 180000 },
          { category: 'SaaS', amount: 120000 },
          { category: 'Travel', amount: 82000 },
          { category: 'CRM', amount: 80000 },
          { category: 'Design Tools', amount: 24000 },
          { category: 'Office', amount: 40000 },
        ],
        spendTrend: [
          { month: 'Jan 2026', amount: 720000, isForecast: false },
          { month: 'Feb 2026', amount: 745000, isForecast: false },
          { month: 'Mar 2026', amount: 875000, isForecast: false },
        ],
      }))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function handleAnalysisComplete(data: { totalFindings: number; totalActions: number; estimatedAnnualSavings: number }) {
    setState((prev) => {
      if (!prev.session) return prev
      const updatedSession = {
        ...prev.session,
        status: 'COMPLETE' as const,
        totalWaste: Math.round(data.estimatedAnnualSavings / 12),
        overspendPct: 28,
      }
      const topActions: TopAction[] = [
        { rank: 1, title: 'Switch AWS to Reserved Instances — save ₹52,000/mo', savingMonthly: 52000, savingAnnual: 624000, confidence: 0.94 },
        { rank: 2, title: 'Reduce Figma licenses from 80 to 35 seats — save ₹13,500/mo', savingMonthly: 13500, savingAnnual: 162000, confidence: 0.88 },
        { rank: 3, title: 'Dispute TechSoft Pro duplicate billing — recover ₹1,20,000', savingMonthly: 10000, savingAnnual: 120000, confidence: 0.97 },
      ]
      return {
        ...prev,
        session: updatedSession,
        isAnalyzing: false,
        cfoSummary: buildCFOSummary(updatedSession, topActions, ['⚠️ AWS spend will exceed ₹2L commit tier in 23 days — triggering ₹40,000 SLA penalty.']),
        spendTrend: [
          { month: 'Jan 2026', amount: 720000, isForecast: false },
          { month: 'Feb 2026', amount: 745000, isForecast: false },
          { month: 'Mar 2026', amount: 875000, isForecast: false },
          { month: 'Apr 2026', amount: 920000, isForecast: true },
          { month: 'May 2026', amount: 960000, isForecast: true },
        ],
      }
    })

    if (state.analyzeSessionId) {
      void loadSessionData(state.analyzeSessionId)
    }
  }

  const firstForecast = state.forecasts[0] ?? null
  const nextMonthWaste = (firstForecast as unknown as { predictedWaste: number } | null)?.predictedWaste ?? 80000

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar sessionStatus={state.session?.status ?? null} />

      <main className="ml-[240px] pt-[60px]">
        <TopBar
          title="Dashboard"
          sessionStatus={state.session?.status ?? null}
          sessionId={state.session?.id ?? null}
          pendingCount={state.pendingCount}
          onLoadDemo={() => void handleLoadDemo()}
        />

        {/* CFO Hero Banner */}
        <CFOHeroBanner summary={state.cfoSummary} loading={loading} />

        {/* Optimize Now Button */}
        {state.session && (
          <div className="px-8 pt-4">
            <button
              onClick={() => setShowOptimize(true)}
              style={{
                width: '100%',
                padding: '14px 0',
                background: 'var(--brand)',
                border: 'none',
                borderRadius: 12,
                color: '#000',
                fontFamily: "'Syne', sans-serif",
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'filter 200ms, transform 200ms',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)'; (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.005)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)'; (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
            >
              ⚡ Optimize Now
            </button>
          </div>
        )}

        <div className="px-8 py-6 space-y-6">
          {/* Analyzing: show progress tracker */}
          {state.isAnalyzing && state.analyzeSessionId && (
            <AgentProgressTracker
              sessionId={state.analyzeSessionId}
              onComplete={handleAnalysisComplete}
            />
          )}

          {/* Waste Ticker */}
          {state.session && state.session.totalWaste > 0 && (
            <WasteTicker annualWaste={state.session.totalWaste * 12} />
          )}

          {/* Metric Cards + Health Score */}
          <div className="grid grid-cols-5 gap-4">
            <MetricCard
              label="Total Spend"
              value={state.session ? '₹' + state.session.totalSpend.toLocaleString('en-IN') : '—'}
              numericValue={state.session?.totalSpend}
              prefix="₹"
              animationDelay={0}
              sub="last 90 days"
              trend={state.session ? { value: '+8.2%', direction: 'up' } : undefined}
              accent="info"
            />
            <MetricCard
              label="Total Waste"
              value={state.session ? '₹' + state.session.totalWaste.toLocaleString('en-IN') : '—'}
              numericValue={state.session?.totalWaste}
              prefix="₹"
              animationDelay={100}
              sub="identified anomalies"
              trend={state.session ? { value: `${state.session.overspendPct.toFixed(1)}% of spend`, direction: 'up' } : undefined}
              accent="danger"
            />
            <MetricCard
              label="Top Action Saves"
              value={state.cfoSummary ? '₹' + state.cfoSummary.topThreeActions[0]?.savingMonthly.toLocaleString('en-IN') + '/mo' : '—'}
              numericValue={state.cfoSummary?.topThreeActions[0]?.savingMonthly}
              prefix="₹"
              suffix="/mo"
              animationDelay={200}
              sub="highest priority action"
              accent="brand"
            />
            <MetricCard
              label="Realized Savings"
              value="₹0"
              numericValue={0}
              prefix="₹"
              animationDelay={300}
              sub="pending first approval"
              accent="brand"
            />
            {/* Budget Health Score */}
            {(() => {
              const criticalCount = 0
              const highCount = 0
              const unaddressed = state.allActions.filter((a) =>
                ['PENDING', 'AWAITING_MANAGER', 'AWAITING_DIRECTOR', 'AWAITING_CFO'].includes(a.status),
              ).length
              const healthData = calculateHealthScore({
                overspendPct: state.session?.overspendPct ?? 0,
                criticalFindings: criticalCount,
                highFindings: highCount,
                unaddressedActions: unaddressed,
                forecastRiskLevel: 0.3,
                totalWaste: state.session?.totalWaste ?? 0,
                totalSpend: state.session?.totalSpend ?? 1,
              })
              return state.session ? (
                <BudgetHealthScore
                  score={healthData.score}
                  grade={healthData.grade}
                  label={healthData.label}
                  color={healthData.color}
                />
              ) : null
            })()}
          </div>

          {/* Main 2-column */}
          <div className="grid grid-cols-5 gap-6">
            {/* Left 60%: Spend Trend Chart */}
            <div className="col-span-3 chart-container">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                  Spend Trend — Actual vs Projected
                </p>
              </div>
              {state.spendTrend.length > 0 ? (
                <SpendTrendChart
                  actualData={state.spendTrend.filter((d) => !d.isForecast)}
                  projectedData={state.spendTrend.filter((d) => d.isForecast)}
                />
              ) : (
                <div className="flex h-[240px] items-center justify-center">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Load demo data to see spend trends
                  </p>
                </div>
              )}
            </div>

            {/* Right 40%: Prioritized Actions */}
            <div className="col-span-2">
              <PrioritizedActionsList actions={state.cfoSummary?.topThreeActions ?? []} />
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-3 gap-6">
            <div className="chart-container">
              <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--text-secondary)' }}>
                Spend by Category
              </p>
              <CategoryDonutChart data={state.categoryData} />
            </div>
            <DataSourcesPanel
              connectedSources={state.session ? ['card-feed'] : []}
              totalRecords={state.session?.totalRecords ?? 0}
            />
            <ForecastAlertCard forecast={firstForecast} nextMonthWaste={nextMonthWaste} />
            <SavingsLeaderboard actionLogs={state.allActions} />
          </div>

          {/* Live Feed + Share row */}
          <div className="grid grid-cols-2 gap-6">
            <LiveFeedPanel />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {state.session && (() => {
                const unaddressed = state.allActions.filter((a) =>
                  ['PENDING', 'AWAITING_MANAGER', 'AWAITING_DIRECTOR', 'AWAITING_CFO'].includes(a.status),
                ).length
                const healthData = calculateHealthScore({
                  overspendPct: state.session?.overspendPct ?? 0,
                  criticalFindings: 0,
                  highFindings: 0,
                  unaddressedActions: unaddressed,
                  forecastRiskLevel: 0.3,
                  totalWaste: state.session?.totalWaste ?? 0,
                  totalSpend: state.session?.totalSpend ?? 1,
                })
                return (
                  <div style={{ padding: '20px 24px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14 }}>
                    <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Export & Share</p>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <ShareableScoreCard
                        score={healthData.score}
                        grade={healthData.grade}
                        annualWaste={(state.session?.totalWaste ?? 0) * 12}
                        totalSavings={state.cfoSummary?.annualSavingsIfActed ?? 0}
                      />
                      <a href="/demo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'rgba(108,142,255,0.1)', border: '1px solid rgba(108,142,255,0.3)', borderRadius: 10, color: '#6C8EFF', fontSize: 13, textDecoration: 'none', fontFamily: "'DM Mono', monospace" }}>
                        ⊞ Fullscreen Demo
                      </a>
                      <a href="/compare" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'rgba(255,181,71,0.1)', border: '1px solid rgba(255,181,71,0.3)', borderRadius: 10, color: '#FFB547', fontSize: 13, textDecoration: 'none', fontFamily: "'DM Mono', monospace" }}>
                        ↔ Compare Spend
                      </a>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      </main>

      {showOptimize && state.session && (
        <OptimizeNowModal
          sessionId={state.session.id}
          onClose={() => setShowOptimize(false)}
        />
      )}
    </div>
  )
}
