-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MANAGER', 'DIRECTOR', 'CFO', 'ADMIN');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('PENDING', 'ANALYZING', 'COMPLETE', 'FAILED');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('CSV', 'PDF_BANK_STATEMENT', 'CARD_FEED', 'MANUAL');

-- CreateEnum
CREATE TYPE "FindingType" AS ENUM ('SPEND_SPIKE', 'DUPLICATE_VENDOR', 'BUDGET_OVERRUN', 'UNUSUAL_PATTERN', 'VENDOR_CONCENTRATION', 'POLICY_VIOLATION', 'UNDERUTILIZED_LICENSE', 'SLA_RISK');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('VENDOR_FREEZE', 'SLACK_ALERT', 'TICKET_CREATE', 'BUDGET_ADJUSTMENT', 'LICENSE_REDUCTION');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('PENDING', 'AUTO_EXECUTED', 'AWAITING_MANAGER', 'AWAITING_DIRECTOR', 'AWAITING_CFO', 'APPROVED', 'EXECUTED', 'REJECTED', 'DELEGATED');

-- CreateEnum
CREATE TYPE "ApprovalTier" AS ENUM ('AUTO', 'MANAGER', 'DIRECTOR', 'CFO');

-- CreateEnum
CREATE TYPE "ReasonCode" AS ENUM ('APPROVED_SAVINGS_VERIFIED', 'REJECTED_BUDGET_CONSTRAINTS', 'REJECTED_VENDOR_CONTRACT', 'REJECTED_INSUFFICIENT_EVIDENCE', 'REJECTED_ESCALATED', 'DELEGATED_TO_DEPARTMENT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'MANAGER',
    "department" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalysisSession" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "SessionStatus" NOT NULL DEFAULT 'PENDING',
    "sourceType" "SourceType" NOT NULL,
    "fileName" TEXT,
    "totalRecords" INTEGER NOT NULL DEFAULT 0,
    "totalSpend" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalWaste" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overspendPct" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "AnalysisSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "vendor" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "description" TEXT,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isAnomaly" BOOLEAN NOT NULL DEFAULT false,
    "isFrozen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finding" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "findingType" "FindingType" NOT NULL,
    "severity" "Severity" NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "baselineAmount" DOUBLE PRECISION NOT NULL,
    "anomalyAmount" DOUBLE PRECISION NOT NULL,
    "deltaAmount" DOUBLE PRECISION NOT NULL,
    "projectedAnnualWaste" DOUBLE PRECISION NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "calculationMethod" TEXT NOT NULL,
    "calculationSteps" JSONB NOT NULL,
    "affectedVendor" TEXT,
    "affectedDepartment" TEXT,
    "affectedCategory" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Finding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionLog" (
    "id" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "actionType" "ActionType" NOT NULL,
    "status" "ActionStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "approvalTier" "ApprovalTier" NOT NULL,
    "estimatedSavingMonthly" DOUBLE PRECISION NOT NULL,
    "estimatedSavingAnnual" DOUBLE PRECISION NOT NULL,
    "dollarThreshold" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "reasonCode" "ReasonCode",
    "reasonNote" TEXT,
    "executedAt" TIMESTAMP(3),
    "executionResult" JSONB,
    "slackMessageTs" TEXT,
    "ticketId" TEXT,

    CONSTRAINT "ActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Simulation" (
    "id" TEXT NOT NULL,
    "actionLogId" TEXT NOT NULL,
    "scenarioName" TEXT NOT NULL,
    "baselineMonthlyData" JSONB NOT NULL,
    "projectedData" JSONB NOT NULL,
    "assumptionNotes" TEXT NOT NULL,
    "projectedSaving3m" DOUBLE PRECISION NOT NULL,
    "projectedSaving12m" DOUBLE PRECISION NOT NULL,
    "breakEvenMonths" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Simulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastRecord" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "forecastMonth" TIMESTAMP(3) NOT NULL,
    "predictedSpend" DOUBLE PRECISION NOT NULL,
    "predictedWaste" DOUBLE PRECISION NOT NULL,
    "riskCategory" TEXT NOT NULL,
    "alertMessage" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "isAlert" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForecastRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ROIRecord" (
    "id" TEXT NOT NULL,
    "actionLogId" TEXT NOT NULL,
    "predictedSaving" DOUBLE PRECISION NOT NULL,
    "actualSaving" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "calculationNote" TEXT NOT NULL,

    CONSTRAINT "ROIRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketLog" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "actionLogId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "assigneeDept" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Simulation_actionLogId_key" ON "Simulation"("actionLogId");

-- CreateIndex
CREATE UNIQUE INDEX "ROIRecord_actionLogId_key" ON "ROIRecord"("actionLogId");

-- CreateIndex
CREATE UNIQUE INDEX "TicketLog_ticketId_key" ON "TicketLog"("ticketId");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AnalysisSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AnalysisSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionLog" ADD CONSTRAINT "ActionLog_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "Finding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionLog" ADD CONSTRAINT "ActionLog_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Simulation" ADD CONSTRAINT "Simulation_actionLogId_fkey" FOREIGN KEY ("actionLogId") REFERENCES "ActionLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastRecord" ADD CONSTRAINT "ForecastRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AnalysisSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ROIRecord" ADD CONSTRAINT "ROIRecord_actionLogId_fkey" FOREIGN KEY ("actionLogId") REFERENCES "ActionLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
