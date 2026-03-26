-- CreateEnum
CREATE TYPE "PolicyCondition" AS ENUM ('SINGLE_TRANSACTION', 'MONTHLY_TOTAL', 'VENDOR_NOT_APPROVED');

-- CreateEnum
CREATE TYPE "PolicyAction" AS ENUM ('FLAG', 'ALERT', 'BLOCK', 'AUTO_REJECT');

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "condition" "PolicyCondition" NOT NULL,
    "field" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION,
    "listValues" TEXT[],
    "action" "PolicyAction" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyViolation" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyViolation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentReasoning" (
    "id" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "eli5Summary" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentReasoning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveFeedEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "department" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isAnomaly" BOOLEAN NOT NULL DEFAULT false,
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveFeedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgentReasoning_findingId_key" ON "AgentReasoning"("findingId");

-- AddForeignKey
ALTER TABLE "PolicyViolation" ADD CONSTRAINT "PolicyViolation_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
