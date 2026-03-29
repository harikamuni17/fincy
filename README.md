<div align="center">

```
  ███████╗██╗███╗   ██╗ ██████╗██╗
  ██╔════╝██║████╗  ██║██╔════╝██║
  █████╗  ██║██╔██╗ ██║██║     ██║
  ██╔══╝  ██║██║╚██╗██║██║     ██║
  ██║     ██║██║ ╚████║╚██████╗██║
  ╚═╝     ╚═╝╚═╝  ╚═══╝ ╚═════╝╚═╝
```

### Autonomous AI CFO Platform

**Detect. Decide. Simulate. Prevent.**

*The only cost intelligence platform that doesn't just find waste — it eliminates it.*

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?style=flat-square&logo=openai&logoColor=white)](https://openai.com)
[![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

<br/>

</div>

---

## The Problem

Every month, companies silently lose lakhs of rupees to the same repeating patterns — unoptimized cloud infrastructure, duplicate vendor billing, SaaS tools nobody uses. Most CFO tools generate reports. They describe the waste. They stop there.

**Finci doesn't stop there.**

---

## What Finci Does

Finci is a four-stage autonomous intelligence loop that closes the gap between detecting a problem and eliminating it.

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   DETECT    │───▶│   DECIDE    │───▶│  SIMULATE   │───▶│   PREVENT   │
│             │    │             │    │             │    │             │
│ Analyzer    │    │ Decision    │    │ What-If     │    │ Forecast    │
│ Agent finds │    │ Agent ranks │    │ Engine runs │    │ Engine warns│
│ anomalies   │    │ best action │    │ before/after│    │ before loss │
│ with math   │    │ by ROI      │    │ projections │    │ happens     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

---

## Quick Start

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 18+ |
| PostgreSQL | 14+ |
| OpenAI API Key | GPT-4o access |
| Slack Webhook | Optional — for live action alerts |

### Setup in 60 Seconds

```bash
# 1. Clone and install
git clone https://github.com/your-org/finci.git
cd finci
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — add DATABASE_URL and OPENAI_API_KEY

# 3. Prepare the database
npm run db:migrate
npm run db:seed

# 4. Launch
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Load Demo Data** to see Finci analyze 847 transactions in under 90 seconds.

---

## The Demo Flow

Finci is built to show a complete AI-driven finance workflow in under 5 minutes.

```
1. Load demo data          →  847 transactions ingested instantly
2. Watch the pipeline      →  4 agents run sequentially via live SSE stream
3. Inspect findings        →  Every anomaly has full statistical math visible
4. Approve actions         →  3-tier workflow (AUTO / MANAGER / CFO)
5. Simulate first          →  Before/after chart with interactive sliders
6. Check the forecast      →  30-day loss prevention alerts
7. Export for the board    →  PDF report + PowerPoint deck, one click each
```

---

## Core Features

### Anomaly Detection Engine
The Analyzer Agent calculates mean, standard deviation, and Z-scores across every vendor, department, and category. Anything with `|Z| > 2.0` is flagged as anomalous — not guessed, not approximated. The full calculation steps are stored and displayed for every finding.

```
Finding: AWS Spend Spike — Engineering Dept
─────────────────────────────────────────────
Baseline avg (Jan–Feb)  ₹42,000 / month
Current month (Mar)     ₹1,17,600
Delta                   ₹75,600 excess
Z-score                 4.1σ  (statistically impossible to be random)
Confidence              87%
Annual risk             ₹9,07,200
```

### Four-Agent AI Pipeline

| Agent | Role | Output |
|-------|------|--------|
| **Analyzer** | Statistical anomaly detection across all expense dimensions | `Finding[]` with full math + `AgentReasoning[]` |
| **Decision** | Ranks corrective actions by ROI, assigns approval tier | `ActionLog[]` sorted by monthly saving |
| **Action** | Executes autonomous actions — Slack, vendor freeze, ticket | Confirmation receipts + audit trail |
| **Monitor** | Compares predicted vs actual savings after execution | `ROIRecord[]` with accuracy percentage |

### Enterprise Approval Workflow

Actions are automatically routed by dollar impact — no manual configuration required.

```
< ₹500          →  AUTO        (executes immediately, no approval needed)
₹500 – ₹5,000  →  MANAGER     (48-hour SLA, email notification sent)
₹5,000 – ₹20K  →  DIRECTOR    (36-hour SLA)
> ₹20,000       →  CFO         (24-hour SLA, escalation if overdue)
```

Every approval requires a documented reason code. Every action generates an immutable audit entry with approver identity and timestamp.

### Autonomous Execution

When an action is approved, Finci fires three things simultaneously:

```bash
✓  Slack alert delivered to #finance-alerts
✓  Vendor frozen — all future transactions flagged
✓  Internal ticket FINCI-{ID} created and assigned
```

### Loss Prevention (Forecast Engine)

The Forecast Engine runs linear regression on historical spend data to project the next 30 days. It detects budget breaches before they happen and surfaces prevention actions directly on the forecast chart.

```
⚠  ACTIVE ALERT
   At current trajectory, you will exceed AWS committed spend
   by ₹2.1L in 23 days — triggering a ₹40,000 SLA penalty.
   
   → Prevent This  (routes to Action Center)
```

### Scenario Simulator

Before approving any action, the CFO can simulate the full financial impact with interactive sliders. The Chart.js projection updates in real time — no server call, no reload.

```
License reduction slider  →  30%
Vendor negotiation        →  15%
─────────────────────────────────
3-month saving            ₹1,56,000
12-month saving           ₹6,24,000
Break-even                0 months
3-year compound impact    ₹22.9L  (at 12% reinvestment rate)
```

---

## Demo Scenarios

Four pre-seeded datasets with realistic anomalies, ready to analyze instantly.

| # | Company | Source Type | Transactions | Total Waste | Overspend |
|---|---------|-------------|--------------|-------------|-----------|
| 1 | TechCorp India | Corporate card feed | 847 | ₹6.55L | 28% |
| 2 | MegaMart Operations | CSV export | 1,240 | ₹11.83L | 24.7% |
| 3 | PrecisionMfg Ltd | Bank PDF | 620 | ₹15.33L | 29.5% |
| 4 | FintechPulse Inc | CSV export | 720 | ₹9.00L | 25% |

Each scenario has pre-injected anomalies — spend spikes, duplicate billing, unused license waste — designed to produce compelling findings in every demo.

---

## API Reference

### Data Ingestion

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ingest/card-feed` | Generate synthetic corporate card transactions |
| `POST` | `/api/ingest/csv` | Upload and parse expense CSV |
| `POST` | `/api/ingest/pdf` | Upload bank statement PDF — OpenAI extracts transactions |

### Analysis Pipeline

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analyze?sessionId=` | Run the 4-agent pipeline — streams progress via SSE |
| `GET` | `/api/findings?sessionId=` | List all findings for a session |
| `GET` | `/api/actions?sessionId=` | List all recommended actions |

### Approval Workflow

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/actions/[id]/approve` | Approve action — requires `reasonCode` in body |
| `POST` | `/api/actions/[id]/reject` | Reject action — requires `reasonCode` in body |
| `POST` | `/api/optimize-batch` | Execute all AUTO-tier actions simultaneously |

### Intelligence

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Finci AI chat — OpenAI with full session context injected |
| `POST` | `/api/simulate` | Run what-if projection for an action |
| `GET` | `/api/forecast?sessionId=` | Fetch 30-day loss projection and alerts |
| `GET` | `/api/roi?sessionId=` | Predicted vs actual savings comparison |

### Exports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/export/pdf` | Generate 4-page CFO Summary Report (PDFKit) |
| `POST` | `/api/export/pptx` | Generate 5-slide Board Deck (pptxgenjs) |

---

## Environment Variables

```env
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/finci
OPENAI_API_KEY=sk-...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Optional
OPENAI_MODEL=gpt-4o
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Approval tier thresholds (defaults shown)
THRESHOLD_AUTO=500
THRESHOLD_MANAGER=5000
THRESHOLD_DIRECTOR=20000
```

---

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed all 4 demo scenarios
npm run db:studio    # Open Prisma Studio (DB browser)
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 14 App Router | Full-stack TypeScript — frontend + API in one repo |
| Language | TypeScript (strict) | End-to-end type safety |
| Database | PostgreSQL + Prisma | Relational expense data, real aggregation queries |
| AI | OpenAI GPT-4o | Function calling for structured agent outputs, streaming chat |
| Styling | Tailwind CSS | Dark theme utility system — `#0A0B0E` base, `#00D4AA` brand |
| Charts | Chart.js + react-chartjs-2 | Spend trend, simulation, forecast, ROI charts |
| PDF | PDFKit | Server-side 4-page CFO report generation |
| PPT | pptxgenjs | 5-slide board deck as real `.pptx` file |
| Realtime | Server-Sent Events (SSE) | Agent pipeline progress streaming |
| Auth | NextAuth.js | Role-based approval routing (MANAGER / DIRECTOR / CFO) |
| Notifications | @slack/webhook + nodemailer | Autonomous action delivery |

---

## Database Schema

13 tables covering the complete lifecycle from raw expense to realized savings.

```
Expense          →  Raw transaction rows from any source
AnalysisSession  →  One per upload/analysis run
Finding          →  Detected anomaly with full calculationSteps JSON
ActionLog        →  Recommendations with approval state and execution metadata
Simulation       →  Before/after projection data per action
ForecastRecord   →  30-day spend projections with alert messages
ROIRecord        →  Actual vs predicted savings per action
AgentReasoning   →  AI thought process stored per finding (auditable)
Policy           →  Custom rule engine (threshold, vendor list, dept cap)
PolicyViolation  →  Rules triggered against live transactions
LiveFeedEvent    →  Real-time webhook transaction stream
TicketLog        →  Internal FINCI-{ID} tickets per action
User             →  Auth users with approval tier roles
```

---

## Project Structure

```
finci/
├── src/
│   ├── app/                  # Next.js pages + API routes
│   │   ├── dashboard/        # Main CFO overview
│   │   ├── findings/         # Anomaly cards with math
│   │   ├── actions/          # Approval center
│   │   ├── simulate/         # What-if engine
│   │   ├── forecast/         # Loss prevention
│   │   ├── roi/              # Realized savings tracker
│   │   ├── policies/         # Custom rules engine
│   │   ├── compare/          # Before/after slider
│   │   ├── demo/             # Fullscreen presentation mode
│   │   └── api/              # All backend routes
│   ├── agents/               # 4 AI agent implementations
│   │   ├── analyzerAgent.ts
│   │   ├── decisionAgent.ts
│   │   ├── actionAgent.ts
│   │   └── monitorAgent.ts
│   ├── components/           # 30+ UI components
│   ├── lib/                  # Shared utilities
│   │   ├── forecastEngine.ts # Linear regression projections
│   │   ├── savingsCalculator.ts
│   │   ├── benchmarks.ts     # Industry median data
│   │   └── pptxExporter.ts
│   └── types/                # Shared TypeScript interfaces
├── prisma/
│   ├── schema.prisma         # 13-table schema
│   └── seed.ts               # 4 realistic demo scenarios
└── .env.example
```

---

## What Makes Finci Different

Most expense tools produce a report. Finci runs a loop.

```
Other tools:   Upload → Analyze → Report
                                    ↓
                              (you figure out the rest)

Finci:         Upload → Analyze → Act → Simulate → Approve → Execute → Measure
                   ↑___________________________________________________|
                                  (loop closes automatically)
```

Every rupee saved is traced back to the specific agent decision, the specific approver, and the specific timestamp — creating a complete financial audit trail that enterprise compliance teams can rely on.

---

## Hackathon Context

Built for a competitive 1-week hackathon (6,400 teams) targeting:

- **Quantifiable cost impact** — every saving shows the exact math
- **Autonomous action** — not just reports, but real execution
- **Data integration depth** — CSV, PDF, live card feed, webhook
- **Enterprise approval workflows** — tier routing, SLA enforcement, audit trail

---

<div align="center">

**Finci** · Detect. Decide. Simulate. Prevent.

*Find the waste. Fix it automatically.*

</div>