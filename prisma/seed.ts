import { PrismaClient, SourceType, SessionStatus } from '@prisma/client'
import { addMonths, subMonths, startOfMonth } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Finci database...')

  // ─── Seed demo users ────────────────────────────────────────────────────────
  const cfo = await prisma.user.upsert({
    where: { email: 'cfo@techcorp.in' },
    update: {},
    create: { email: 'cfo@techcorp.in', name: 'Arjun Mehta', role: 'CFO', department: 'Finance' },
  })
  const director = await prisma.user.upsert({
    where: { email: 'director@techcorp.in' },
    update: {},
    create: { email: 'director@techcorp.in', name: 'Priya Sharma', role: 'DIRECTOR', department: 'Engineering' },
  })
  const manager = await prisma.user.upsert({
    where: { email: 'manager@techcorp.in' },
    update: {},
    create: { email: 'manager@techcorp.in', name: 'Rohit Gupta', role: 'MANAGER', department: 'Sales' },
  })

  // ─── Scenario 1: TechCorp India (SaaS Startup) ──────────────────────────────
  const session1 = await prisma.analysisSession.create({
    data: {
      status: SessionStatus.COMPLETE,
      sourceType: SourceType.CARD_FEED,
      fileName: 'techcorp_card_feed_q1.json',
      totalRecords: 847,
      totalSpend: 2340000,
      totalWaste: 655200,
      overspendPct: 28,
    },
  })

  const now = new Date()
  const months = [-2, -1, 0].map((offset) => startOfMonth(addMonths(now, offset)))

  const saasVendors = [
    { vendor: 'AWS', category: 'Cloud', dept: 'Engineering' },
    { vendor: 'Zoom', category: 'SaaS', dept: 'Operations' },
    { vendor: 'Slack', category: 'SaaS', dept: 'Operations' },
    { vendor: 'Notion', category: 'SaaS', dept: 'Product' },
    { vendor: 'Figma', category: 'Design Tools', dept: 'Design' },
    { vendor: 'HubSpot', category: 'CRM', dept: 'Sales' },
    { vendor: 'Salesforce', category: 'CRM', dept: 'Sales' },
    { vendor: 'Google Workspace', category: 'Productivity', dept: 'Operations' },
    { vendor: 'TechSoft Pro', category: 'SaaS', dept: 'Engineering' },
  ]

  // Normal spend amounts per vendor per month
  const normalSpend: Record<string, number> = {
    AWS: 42000, Zoom: 18000, Slack: 45000, Notion: 8500,
    Figma: 24000, HubSpot: 32000, Salesforce: 48000,
    'Google Workspace': 12000, 'TechSoft Pro': 12000,
  }

  const travelNormal: Record<number, number> = { 0: 18000, 1: 21000, 2: 82000 }

  for (let mi = 0; mi < 3; mi++) {
    const month = months[mi]
    for (const v of saasVendors) {
      let amount = normalSpend[v.vendor]
      // Anomaly 1: AWS spike in month 3
      if (v.vendor === 'AWS' && mi === 2) amount = 117600
      // Anomaly 2: TechSoft Pro annual billing in same month as monthly
      if (v.vendor === 'TechSoft Pro' && mi === 2) {
        await prisma.expense.create({
          data: {
            sessionId: session1.id,
            date: month,
            vendor: v.vendor,
            amount: 120000,
            category: v.category,
            department: v.dept,
            description: 'Annual subscription renewal',
            isAnomaly: true,
          },
        })
      }
      await prisma.expense.create({
        data: {
          sessionId: session1.id,
          date: month,
          vendor: v.vendor,
          amount,
          category: v.category,
          department: v.dept,
          description: `${v.vendor} monthly subscription`,
          isAnomaly: mi === 2 && v.vendor === 'AWS',
        },
      })
    }

    // Sales travel
    await prisma.expense.create({
      data: {
        sessionId: session1.id,
        date: month,
        vendor: 'MakeMyTrip Corporate',
        amount: travelNormal[mi],
        category: 'Travel',
        department: 'Sales',
        description: 'Sales team travel expenses',
        isAnomaly: mi === 2,
      },
    })
  }

  // ─── Findings for scenario 1 ──────────────────────────────────────────────
  const f1 = await prisma.finding.create({
    data: {
      sessionId: session1.id,
      title: 'AWS Spend Spike — Engineering Dept',
      description:
        'AWS cloud spend in March was 2.8× the 2-month average, representing a critical infrastructure cost anomaly. Immediate review of reserved instance utilization and auto-scaling policies is recommended.',
      findingType: 'SPEND_SPIKE',
      severity: 'CRITICAL',
      riskScore: 0.94,
      baselineAmount: 41500,
      anomalyAmount: 117600,
      deltaAmount: 76100,
      projectedAnnualWaste: 913200,
      confidenceScore: 0.94,
      calculationMethod: 'z-score anomaly detection',
      calculationSteps: [
        { step: 'baseline_avg', value: 41500, unit: 'INR', explanation: 'Average AWS spend over Jan + Feb: ₹41,500' },
        { step: 'current_value', value: 117600, unit: 'INR', explanation: "This month's AWS spend: ₹1,17,600" },
        { step: 'delta', value: 76100, unit: 'INR', explanation: 'Excess spend: ₹1,17,600 - ₹41,500 = ₹76,100' },
        { step: 'z_score', value: 2.8, unit: 'zscore', explanation: 'Z-score: 2.80 — highly anomalous (>2σ threshold)' },
        { step: 'confidence', value: 0.94, unit: 'percent', explanation: '94% confidence this is not normal variation' },
        { step: 'annual_projection', value: 913200, unit: 'INR', explanation: 'If this continues: ₹76,100 × 12 = ₹9,13,200/year at risk' },
      ],
      affectedVendor: 'AWS',
      affectedDepartment: 'Engineering',
      affectedCategory: 'Cloud',
    },
  })

  const f2 = await prisma.finding.create({
    data: {
      sessionId: session1.id,
      title: 'Duplicate TechSoft Pro Billing Detected',
      description:
        'TechSoft Pro charged both a monthly fee (₹12,000) and an annual fee (₹1,20,000) in the same billing cycle. This represents a duplicate payment requiring immediate vendor dispute.',
      findingType: 'DUPLICATE_VENDOR',
      severity: 'HIGH',
      riskScore: 0.97,
      baselineAmount: 12000,
      anomalyAmount: 132000,
      deltaAmount: 120000,
      projectedAnnualWaste: 120000,
      confidenceScore: 0.97,
      calculationMethod: 'duplicate billing pattern detection',
      calculationSteps: [
        { step: 'baseline_avg', value: 12000, unit: 'INR', explanation: 'Normal monthly TechSoft Pro billing: ₹12,000' },
        { step: 'current_value', value: 132000, unit: 'INR', explanation: 'March billing: monthly ₹12,000 + annual ₹1,20,000' },
        { step: 'delta', value: 120000, unit: 'INR', explanation: 'Duplicate annual charge: ₹1,20,000' },
        { step: 'z_score', value: 9.5, unit: 'zscore', explanation: 'Z-score: 9.50 — extreme anomaly, near-certain duplicate' },
        { step: 'confidence', value: 0.97, unit: 'percent', explanation: '97% confidence this is a duplicate billing event' },
        { step: 'annual_projection', value: 120000, unit: 'INR', explanation: 'One-time recovery: ₹1,20,000 refundable' },
      ],
      affectedVendor: 'TechSoft Pro',
      affectedDepartment: 'Engineering',
      affectedCategory: 'SaaS',
    },
  })

  const f3 = await prisma.finding.create({
    data: {
      sessionId: session1.id,
      title: 'Figma License Utilization at 39%',
      description:
        'Figma has 80 seats provisioned but only 31 active users in the last 30 days. The remaining 49 unused seats represent direct subscription waste that can be eliminated immediately.',
      findingType: 'UNDERUTILIZED_LICENSE',
      severity: 'HIGH',
      riskScore: 0.88,
      baselineAmount: 24000,
      anomalyAmount: 24000,
      deltaAmount: 14700,
      projectedAnnualWaste: 176400,
      confidenceScore: 0.88,
      calculationMethod: 'license utilization analysis',
      calculationSteps: [
        { step: 'baseline_avg', value: 80, unit: 'count', explanation: 'Total Figma seats purchased: 80' },
        { step: 'current_value', value: 31, unit: 'count', explanation: 'Active users (logged in last 30 days): 31' },
        { step: 'delta', value: 49, unit: 'count', explanation: 'Unused seats: 80 - 31 = 49 (61% waste)' },
        { step: 'z_score', value: 0, unit: 'zscore', explanation: 'Utilization: 38.75% — industry standard is >80%' },
        { step: 'confidence', value: 0.88, unit: 'percent', explanation: '88% confidence these seats will remain unused' },
        { step: 'annual_projection', value: 176400, unit: 'INR', explanation: '49 seats × ₹300/seat/month × 12 = ₹1,76,400/year waste' },
      ],
      affectedVendor: 'Figma',
      affectedDepartment: 'Design',
      affectedCategory: 'Design Tools',
    },
  })

  const f4 = await prisma.finding.create({
    data: {
      sessionId: session1.id,
      title: 'Sales Travel Spike — 3.9× Normal Spend',
      description:
        'Sales department travel expenses in March were ₹82,000 versus a 2-month average of ₹19,500. No corresponding revenue event or approved travel plan was found in the system.',
      findingType: 'SPEND_SPIKE',
      severity: 'HIGH',
      riskScore: 0.82,
      baselineAmount: 19500,
      anomalyAmount: 82000,
      deltaAmount: 62500,
      projectedAnnualWaste: 375000,
      confidenceScore: 0.82,
      calculationMethod: 'z-score anomaly detection',
      calculationSteps: [
        { step: 'baseline_avg', value: 19500, unit: 'INR', explanation: 'Average Sales travel: (₹18,000 + ₹21,000) / 2 = ₹19,500' },
        { step: 'current_value', value: 82000, unit: 'INR', explanation: "March Sales travel: ₹82,000" },
        { step: 'delta', value: 62500, unit: 'INR', explanation: 'Excess: ₹82,000 - ₹19,500 = ₹62,500' },
        { step: 'z_score', value: 3.21, unit: 'zscore', explanation: 'Z-score: 3.21 — highly anomalous (>3σ)' },
        { step: 'confidence', value: 0.82, unit: 'percent', explanation: '82% confidence this is an unauthorized spend event' },
        { step: 'annual_projection', value: 375000, unit: 'INR', explanation: 'If recurring: ₹62,500 × 6 peak months = ₹3,75,000/year at risk' },
      ],
      affectedVendor: 'MakeMyTrip Corporate',
      affectedDepartment: 'Sales',
      affectedCategory: 'Travel',
    },
  })

  // ─── Actions for scenario 1 ───────────────────────────────────────────────
  await prisma.actionLog.create({
    data: {
      findingId: f1.id,
      title: 'Switch AWS engineering workloads to Reserved Instances — save ₹52,000/mo',
      description: 'Convert 4 on-demand EC2 instances (m5.2xlarge) to 1-year reserved instances. Historical utilization shows >95% uptime, making reserved pricing optimal.',
      actionType: 'BUDGET_ADJUSTMENT',
      status: 'AWAITING_CFO',
      priority: 1,
      approvalTier: 'CFO',
      estimatedSavingMonthly: 52000,
      estimatedSavingAnnual: 624000,
      dollarThreshold: 52000,
    },
  })

  await prisma.actionLog.create({
    data: {
      findingId: f3.id,
      title: 'Reduce Figma licenses from 80 to 35 seats — save ₹13,500/mo',
      description: 'Reduce Figma subscription from 80 seats to 35 seats. Retain 31 active users plus 4 buffer seats. Eliminates 45 redundant licenses immediately.',
      actionType: 'LICENSE_REDUCTION',
      status: 'AUTO_EXECUTED',
      priority: 2,
      approvalTier: 'AUTO',
      estimatedSavingMonthly: 13500,
      estimatedSavingAnnual: 162000,
      dollarThreshold: 13500,
      executedAt: now,
      executionResult: { action: 'license_reduction', vendor: 'Figma', seatsRemoved: 45, ticketRaised: 'FINCI-AUTO-001' },
    },
  })

  await prisma.actionLog.create({
    data: {
      findingId: f2.id,
      title: 'Dispute duplicate TechSoft Pro annual billing — recover ₹1,20,000',
      description: 'Raise vendor dispute with TechSoft Pro for duplicate annual billing. Evidence: simultaneous monthly + annual charge on same account in same calendar month.',
      actionType: 'TICKET_CREATE',
      status: 'AWAITING_MANAGER',
      priority: 3,
      approvalTier: 'MANAGER',
      estimatedSavingMonthly: 10000,
      estimatedSavingAnnual: 120000,
      dollarThreshold: 10000,
    },
  })

  // ─── Forecasts for scenario 1 ─────────────────────────────────────────────
  await prisma.forecastRecord.createMany({
    data: [
      {
        sessionId: session1.id,
        forecastMonth: addMonths(now, 1),
        predictedSpend: 2520000,
        predictedWaste: 720000,
        riskCategory: 'HIGH',
        alertMessage: '⚠️ At current trajectory, AWS spend will exceed ₹2L committed tier in 23 days — triggering ₹40,000 SLA penalty.',
        confidence: 0.87,
        isAlert: true,
      },
      {
        sessionId: session1.id,
        forecastMonth: addMonths(now, 2),
        predictedSpend: 2680000,
        predictedWaste: 810000,
        riskCategory: 'CRITICAL',
        alertMessage: '⚠️ Slack license overrun projected in 45 days if team grows at current rate.',
        confidence: 0.79,
        isAlert: true,
      },
      {
        sessionId: session1.id,
        forecastMonth: addMonths(now, 3),
        predictedSpend: 2750000,
        predictedWaste: 880000,
        riskCategory: 'CRITICAL',
        alertMessage: '⚠️ Projected month-3 waste of ₹88,000 if no actions taken.',
        confidence: 0.72,
        isAlert: false,
      },
    ],
  })

  // ─── Scenario 2: MegaMart Operations (Retail) ─────────────────────────────
  const session2 = await prisma.analysisSession.create({
    data: {
      status: SessionStatus.COMPLETE,
      sourceType: SourceType.CSV,
      fileName: 'megamart_expenses_q1.csv',
      totalRecords: 1240,
      totalSpend: 4800000,
      totalWaste: 1183333,
      overspendPct: 24.7,
    },
  })

  const retailVendors = [
    { vendor: 'FastFreight Logistics', category: 'Logistics', dept: 'Operations', normal: 180000 },
    { vendor: 'QuickDeliver Co', category: 'Logistics', dept: 'Operations', normal: 95000 },
    { vendor: 'BuildRight Maintenance', category: 'Maintenance', dept: 'Facilities', normal: 42000 },
    { vendor: 'FixIt Solutions', category: 'Maintenance', dept: 'Facilities', normal: 42000 },
    { vendor: 'TamilNadu Electricity Board', category: 'Utilities', dept: 'Operations', normal: 85000 },
    { vendor: 'PackagePro Supplies', category: 'Supplies', dept: 'Operations', normal: 35000 },
  ]

  for (let mi = 0; mi < 3; mi++) {
    const month = months[mi]
    for (const v of retailVendors) {
      let amount = v.normal
      // Anomaly 1: FastFreight 3× in month 3
      if (v.vendor === 'FastFreight Logistics' && mi === 2) amount = v.normal * 3
      // Anomaly 2: Duplicate maintenance vendors same day
      if (v.vendor === 'BuildRight Maintenance' && mi === 2) amount = 42000
      if (v.vendor === 'FixIt Solutions' && mi === 2) amount = 42000
      // Anomaly 3: Electricity 45% above baseline in month 3
      if (v.vendor === 'TamilNadu Electricity Board' && mi === 2) amount = Math.round(v.normal * 1.45)
      await prisma.expense.create({
        data: {
          sessionId: session2.id,
          date: month,
          vendor: v.vendor,
          amount,
          category: v.category,
          department: v.dept,
          description: `${v.vendor} invoice`,
          isAnomaly: mi === 2 && (v.vendor === 'FastFreight Logistics' || (v.vendor === 'FixIt Solutions') || v.vendor === 'TamilNadu Electricity Board'),
        },
      })
    }
  }

  const f5 = await prisma.finding.create({
    data: {
      sessionId: session2.id,
      title: 'FastFreight Logistics Billed at 3× Contract Rate',
      description:
        'FastFreight Logistics invoiced ₹5,40,000 in March versus the contracted rate of ₹1,80,000. This represents a 200% billing overcharge that requires immediate vendor escalation.',
      findingType: 'POLICY_VIOLATION',
      severity: 'CRITICAL',
      riskScore: 0.96,
      baselineAmount: 180000,
      anomalyAmount: 540000,
      deltaAmount: 360000,
      projectedAnnualWaste: 4320000,
      confidenceScore: 0.96,
      calculationMethod: 'contract rate deviation analysis',
      calculationSteps: [
        { step: 'baseline_avg', value: 180000, unit: 'INR', explanation: 'Contracted FastFreight rate: ₹1,80,000/month' },
        { step: 'current_value', value: 540000, unit: 'INR', explanation: 'March invoice: ₹5,40,000' },
        { step: 'delta', value: 360000, unit: 'INR', explanation: 'Overcharge: ₹5,40,000 - ₹1,80,000 = ₹3,60,000' },
        { step: 'z_score', value: 4.1, unit: 'zscore', explanation: 'Z-score: 4.10 — extreme billing anomaly' },
        { step: 'confidence', value: 0.96, unit: 'percent', explanation: '96% confidence this is a billing error vs contract' },
        { step: 'annual_projection', value: 4320000, unit: 'INR', explanation: 'Annualized risk: ₹3,60,000 × 12 = ₹43,20,000/year' },
      ],
      affectedVendor: 'FastFreight Logistics',
      affectedDepartment: 'Operations',
      affectedCategory: 'Logistics',
    },
  })

  await prisma.finding.create({
    data: {
      sessionId: session2.id,
      title: 'Duplicate Maintenance Vendor Billing on Same Date',
      description:
        'BuildRight Maintenance and FixIt Solutions both billed ₹42,000 on the same date for identical scope-of-work descriptions. Evidence strongly suggests duplicate service billing.',
      findingType: 'DUPLICATE_VENDOR',
      severity: 'HIGH',
      riskScore: 0.91,
      baselineAmount: 42000,
      anomalyAmount: 84000,
      deltaAmount: 42000,
      projectedAnnualWaste: 504000,
      confidenceScore: 0.91,
      calculationMethod: 'duplicate billing pattern detection',
      calculationSteps: [
        { step: 'baseline_avg', value: 42000, unit: 'INR', explanation: 'Normal single maintenance vendor charge: ₹42,000' },
        { step: 'current_value', value: 84000, unit: 'INR', explanation: 'March: two vendors charged ₹42,000 each same day' },
        { step: 'delta', value: 42000, unit: 'INR', explanation: 'Suspected duplicate: ₹42,000' },
        { step: 'z_score', value: 3.2, unit: 'zscore', explanation: 'Z-score: 3.20 — highly anomalous coincident billing' },
        { step: 'confidence', value: 0.91, unit: 'percent', explanation: '91% confidence this is a duplicate service billing' },
        { step: 'annual_projection', value: 504000, unit: 'INR', explanation: 'If recurring quarterly: ₹42,000 × 12 = ₹5,04,000/year at risk' },
      ],
      affectedDepartment: 'Facilities',
      affectedCategory: 'Maintenance',
    },
  })

  await prisma.finding.create({
    data: {
      sessionId: session2.id,
      title: 'Electricity Consumption 45% Above Seasonal Baseline',
      description:
        'TamilNadu Electricity Board bill for March was ₹1,23,250 versus the 2-month baseline of ₹85,000. Operational inefficiency or unreported equipment addition is the likely cause.',
      findingType: 'BUDGET_OVERRUN',
      severity: 'MEDIUM',
      riskScore: 0.74,
      baselineAmount: 85000,
      anomalyAmount: 123250,
      deltaAmount: 38250,
      projectedAnnualWaste: 459000,
      confidenceScore: 0.74,
      calculationMethod: 'seasonal baseline comparison',
      calculationSteps: [
        { step: 'baseline_avg', value: 85000, unit: 'INR', explanation: 'Average electricity spend Jan-Feb: ₹85,000' },
        { step: 'current_value', value: 123250, unit: 'INR', explanation: 'March electricity bill: ₹1,23,250' },
        { step: 'delta', value: 38250, unit: 'INR', explanation: 'Overspend: ₹1,23,250 - ₹85,000 = ₹38,250' },
        { step: 'z_score', value: 2.1, unit: 'zscore', explanation: 'Z-score: 2.10 — moderately anomalous' },
        { step: 'confidence', value: 0.74, unit: 'percent', explanation: '74% confidence this is operational inefficiency' },
        { step: 'annual_projection', value: 459000, unit: 'INR', explanation: 'Annual risk: ₹38,250 × 12 = ₹4,59,000/year' },
      ],
      affectedVendor: 'TamilNadu Electricity Board',
      affectedDepartment: 'Operations',
      affectedCategory: 'Utilities',
    },
  })

  await prisma.actionLog.create({
    data: {
      findingId: f5.id,
      title: 'Escalate FastFreight contract overcharge — recover ₹3,60,000',
      description: 'Freeze all FastFreight payments above contracted amount. Raise formal billing dispute with contract reference. Engage legal if not resolved in 5 business days.',
      actionType: 'VENDOR_FREEZE',
      status: 'AWAITING_CFO',
      priority: 1,
      approvalTier: 'CFO',
      estimatedSavingMonthly: 360000,
      estimatedSavingAnnual: 4320000,
      dollarThreshold: 360000,
    },
  })

  // ─── Scenario 3: PrecisionMfg Ltd (Manufacturing) ─────────────────────────
  const session3 = await prisma.analysisSession.create({
    data: {
      status: SessionStatus.COMPLETE,
      sourceType: SourceType.PDF_BANK_STATEMENT,
      fileName: 'precisionmfg_bank_stmt_q1.pdf',
      totalRecords: 620,
      totalSpend: 5200000,
      totalWaste: 1533333,
      overspendPct: 29.5,
    },
  })

  const mfgVendors = [
    { vendor: 'ProMaint Engineering', category: 'Maintenance', dept: 'Manufacturing', normal: 95000 },
    { vendor: 'SteelCraft Supplies', category: 'Raw Materials', dept: 'Manufacturing', normal: 420000 },
    { vendor: 'LogiPrime Transport', category: 'Logistics', dept: 'Operations', normal: 65000 },
    { vendor: 'QualityCheck Labs', category: 'Quality', dept: 'Quality', normal: 28000 },
  ]

  for (let mi = 0; mi < 3; mi++) {
    const month = months[mi]
    for (const v of mfgVendors) {
      let amount = v.normal
      // Equipment maintenance outside contracted hours
      if (v.vendor === 'ProMaint Engineering' && mi === 2) amount = Math.round(v.normal * 1.4)
      // Partial shipment at full price
      if (v.vendor === 'SteelCraft Supplies' && mi === 2) amount = v.normal
      await prisma.expense.create({
        data: {
          sessionId: session3.id,
          date: month,
          vendor: v.vendor,
          amount,
          category: v.category,
          department: v.dept,
          description: `${v.vendor} ${mi === 2 ? 'invoice with overtime' : 'standard invoice'}`,
          isAnomaly: mi === 2 && v.vendor === 'ProMaint Engineering',
        },
      })
    }
  }

  const f7 = await prisma.finding.create({
    data: {
      sessionId: session3.id,
      title: 'ProMaint Engineering Billed 40% Premium for Off-Hours',
      description:
        'ProMaint Engineering invoiced ₹1,33,000 in March versus the contracted ₹95,000 rate. The premium is attributed to after-hours maintenance calls not covered by the SLA, indicating scheduling inefficiency.',
      findingType: 'POLICY_VIOLATION',
      severity: 'HIGH',
      riskScore: 0.85,
      baselineAmount: 95000,
      anomalyAmount: 133000,
      deltaAmount: 38000,
      projectedAnnualWaste: 456000,
      confidenceScore: 0.85,
      calculationMethod: 'contract rate deviation analysis',
      calculationSteps: [
        { step: 'baseline_avg', value: 95000, unit: 'INR', explanation: 'Contracted ProMaint rate: ₹95,000/month' },
        { step: 'current_value', value: 133000, unit: 'INR', explanation: 'March invoice: ₹1,33,000 (includes 40% off-hours premium)' },
        { step: 'delta', value: 38000, unit: 'INR', explanation: 'Premium overcharge: ₹1,33,000 - ₹95,000 = ₹38,000' },
        { step: 'z_score', value: 2.4, unit: 'zscore', explanation: 'Z-score: 2.40 — significant deviation' },
        { step: 'confidence', value: 0.85, unit: 'percent', explanation: '85% confidence scheduling adjustment will eliminate premium' },
        { step: 'annual_projection', value: 456000, unit: 'INR', explanation: '₹38,000 × 12 = ₹4,56,000/year in avoidable off-hours premium' },
      ],
      affectedVendor: 'ProMaint Engineering',
      affectedDepartment: 'Manufacturing',
      affectedCategory: 'Maintenance',
    },
  })

  await prisma.finding.create({
    data: {
      sessionId: session3.id,
      title: 'SteelCraft Partial Shipment Billed at Full Contract Value',
      description:
        'SteelCraft Supplies delivered 68% of the ordered raw material quantity but invoiced for 100%. The ₹1,34,400 discrepancy on this single invoice requires immediate vendor credit note.',
      findingType: 'POLICY_VIOLATION',
      severity: 'HIGH',
      riskScore: 0.93,
      baselineAmount: 285600,
      anomalyAmount: 420000,
      deltaAmount: 134400,
      projectedAnnualWaste: 806400,
      confidenceScore: 0.93,
      calculationMethod: 'quantity-price variance analysis',
      calculationSteps: [
        { step: 'baseline_avg', value: 285600, unit: 'INR', explanation: 'Expected amount for 68% delivery: ₹2,85,600' },
        { step: 'current_value', value: 420000, unit: 'INR', explanation: 'Invoice raised for full order: ₹4,20,000' },
        { step: 'delta', value: 134400, unit: 'INR', explanation: 'Overbilling for undelivered goods: ₹4,20,000 - ₹2,85,600 = ₹1,34,400' },
        { step: 'z_score', value: 5.2, unit: 'zscore', explanation: 'Z-score: 5.20 — near-certain billing discrepancy' },
        { step: 'confidence', value: 0.93, unit: 'percent', explanation: '93% confidence this is an unresolved partial shipment issue' },
        { step: 'annual_projection', value: 806400, unit: 'INR', explanation: 'If recurring quarterly: ₹1,34,400 × 6 = ₹8,06,400/year at risk' },
      ],
      affectedVendor: 'SteelCraft Supplies',
      affectedDepartment: 'Manufacturing',
      affectedCategory: 'Raw Materials',
    },
  })

  await prisma.finding.create({
    data: {
      sessionId: session3.id,
      title: 'SLA Risk — Quality Compliance Cost Trending to ₹5L Penalty',
      description:
        'QualityCheck Labs spending is trending upward at 18% month-over-month. At this trajectory, quality compliance costs will breach the ₹5,00,000 threshold triggering a mandatory SLA penalty within 47 days.',
      findingType: 'SLA_RISK',
      severity: 'CRITICAL',
      riskScore: 0.9,
      baselineAmount: 28000,
      anomalyAmount: 39000,
      deltaAmount: 11000,
      projectedAnnualWaste: 500000,
      confidenceScore: 0.9,
      calculationMethod: 'linear regression trend + SLA threshold analysis',
      calculationSteps: [
        { step: 'baseline_avg', value: 28000, unit: 'INR', explanation: 'QualityCheck Labs 2-month avg: ₹28,000' },
        { step: 'current_value', value: 39000, unit: 'INR', explanation: 'March QualityCheck spend: ₹39,000 (+39% MoM)' },
        { step: 'delta', value: 11000, unit: 'INR', explanation: 'Month-over-month increase: ₹11,000' },
        { step: 'z_score', value: 2.6, unit: 'zscore', explanation: 'Growth rate z-score: 2.60 — trend is highly significant' },
        { step: 'confidence', value: 0.9, unit: 'percent', explanation: '90% confidence SLA threshold will be breached in ~47 days' },
        { step: 'annual_projection', value: 500000, unit: 'INR', explanation: 'SLA penalty trigger: ₹5,00,000 — preventable if action taken within 30 days' },
      ],
      affectedVendor: 'QualityCheck Labs',
      affectedDepartment: 'Quality',
      affectedCategory: 'Quality',
    },
  })

  await prisma.actionLog.create({
    data: {
      findingId: f7.id,
      title: 'Reschedule ProMaint maintenance to business hours — save ₹38,000/mo',
      description: 'Coordinate with ProMaint Engineering to shift all non-emergency maintenance to weekday 9-6 window. Eliminates off-hours premium charge per contract clause 4.2.',
      actionType: 'TICKET_CREATE',
      status: 'AWAITING_MANAGER',
      priority: 1,
      approvalTier: 'MANAGER',
      estimatedSavingMonthly: 38000,
      estimatedSavingAnnual: 456000,
      dollarThreshold: 38000,
    },
  })

  // ─── Scenario 4: FintechPulse Inc (Payments) ───────────────────────────────
  const session4 = await prisma.analysisSession.create({
    data: {
      status: SessionStatus.COMPLETE,
      sourceType: SourceType.CSV,
      fileName: 'fintechpulse_payments_q1.csv',
      totalRecords: 720,
      totalSpend: 3600000,
      totalWaste: 900000,
      overspendPct: 25,
    },
  })

  const paymentsVendors = [
    { vendor: 'PayFast Payments', category: 'Payments', dept: 'Finance', normal: 150000 },
    { vendor: 'CloudGuard Security', category: 'Security', dept: 'IT', normal: 62000 },
    { vendor: 'FleetOne Transport', category: 'Logistics', dept: 'Operations', normal: 54000 },
    { vendor: 'PaperTrail Supplies', category: 'Office', dept: 'Admin', normal: 22000 },
  ]

  for (let mi = 0; mi < 3; mi++) {
    const month = months[mi]
    for (const v of paymentsVendors) {
      let amount = v.normal
      if (v.vendor === 'PayFast Payments' && mi === 2) amount = Math.round(v.normal * 2.5)
      if (v.vendor === 'CloudGuard Security' && mi === 2) amount = v.normal + 28000
      if (v.vendor === 'FleetOne Transport' && mi === 2) amount = Math.round(v.normal * 1.8)

      await prisma.expense.create({
        data: {
          sessionId: session4.id,
          date: month,
          vendor: v.vendor,
          amount,
          category: v.category,
          department: v.dept,
          description: `${v.vendor} invoice`,
          isAnomaly: mi === 2 && ['PayFast Payments', 'CloudGuard Security', 'FleetOne Transport'].includes(v.vendor),
        },
      })
    }
  }

  const f8 = await prisma.finding.create({
    data: {
      sessionId: session4.id,
      title: 'PayFast Settlement Fees Spike — Finance Impact',
      description:
        'PayFast Payments settlement fees jumped 150% in March compared to the prior two months, driven by an unexpected surcharge on high-volume transactions. Review the payment routing terms immediately.',
      findingType: 'BUDGET_OVERRUN',
      severity: 'HIGH',
      riskScore: 0.89,
      baselineAmount: 150000,
      anomalyAmount: 375000,
      deltaAmount: 225000,
      projectedAnnualWaste: 2700000,
      confidenceScore: 0.89,
      calculationMethod: 'fee spike trend analysis',
      calculationSteps: [
        { step: 'baseline_avg', value: 150000, unit: 'INR', explanation: 'Average PayFast fees over Jan-Feb: ₹1,50,000' },
        { step: 'current_value', value: 375000, unit: 'INR', explanation: 'March fees: ₹3,75,000' },
        { step: 'delta', value: 225000, unit: 'INR', explanation: 'Excess fees: ₹3,75,000 - ₹1,50,000 = ₹2,25,000' },
        { step: 'z_score', value: 3.8, unit: 'zscore', explanation: 'Z-score: 3.80 — significant fee anomaly' },
        { step: 'confidence', value: 0.89, unit: 'percent', explanation: '89% confidence this is not normal variability' },
        { step: 'annual_projection', value: 2700000, unit: 'INR', explanation: 'If this repeats: ₹2,25,000 × 12 = ₹27,00,000/year' },
      ],
      affectedVendor: 'PayFast Payments',
      affectedDepartment: 'Finance',
      affectedCategory: 'Payments',
    },
  })

  await prisma.actionLog.create({
    data: {
      findingId: f8.id,
      title: 'Review PayFast fee schedule and renegotiate settlement terms',
      description: 'Engage the payments team to review all PayFast transaction fees and negotiate a lower settlement schedule based on volume discounts.',
      actionType: 'TICKET_CREATE',
      status: 'AWAITING_MANAGER',
      priority: 2,
      approvalTier: 'MANAGER',
      estimatedSavingMonthly: 225000,
      estimatedSavingAnnual: 2700000,
      dollarThreshold: 225000,
    },
  })

  console.log('✅ Seed complete.')
  console.log(`  Session 1 (TechCorp India):  ${session1.id}`)
  console.log(`  Session 2 (MegaMart):        ${session2.id}`)
  console.log(`  Session 3 (PrecisionMfg):    ${session3.id}`)
  console.log(`  Users created: ${cfo.email}, ${director.email}, ${manager.email}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
