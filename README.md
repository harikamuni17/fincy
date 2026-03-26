# Finci — Autonomous AI CFO Platform

> **Detect. Decide. Simulate. Prevent.**  
> Most solutions stop at identifying cost inefficiencies. Finci goes further — it autonomously decides the best corrective actions, simulates their financial impact, and prevents future losses before they happen.

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- OpenAI API key (GPT-4o recommended)
- Slack webhook URL (optional — for live Slack alerts)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy and configure environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and OPENAI_API_KEY

# 3. Run database migrations
npx prisma migrate dev --name init

# 4. Seed demo data (3 scenarios)
npm run db:seed

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the dashboard.

---

## 4-Minute Demo Flow

1. **Load Demo Data** — Click "Load Demo Data" on the Dashboard (top bar)  
2. **Run Analysis** — Watch the Agent Progress Tracker show live stage transitions via SSE  
3. **CFO Banner** — "Your company is overspending 28% — saving ₹9.6L annually"  
4. **Findings Page** — 4 findings, math breakdown expanded by default  
5. **Actions Page** — Top 3 prioritized actions, Slack alert auto-sent  
6. **Forecast Page** — "⚠️ ₹80K projected waste next 30 days"  
7. **Simulate Page** — Drag license reduction slider, watch chart animate  
8. **Export PDF** — Download full CFO report  

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 14 App Router                 │
├─────────────────────────────────────────────────────────┤
│  Pages: Dashboard · Findings · Actions · Simulate        │
│         Forecast · ROI Tracker · Upload                  │
├─────────────────────────────────────────────────────────┤
│  4-Stage AI Agent Pipeline (SSE streaming)               │
│  ① Analyzer   — z-score anomaly detection on expenses   │
│  ② Decision   — GPT-4o ranks optimal corrective actions  │
│  ③ Action     — Slack alert + vendor freeze + ticket     │
│  ④ Forecast   — Linear regression + seasonal adjustment  │
├─────────────────────────────────────────────────────────┤
│  PostgreSQL (Prisma ORM)  ·  OpenAI GPT-4o              │
│  Slack Webhooks  ·  PDFKit  ·  Chart.js                  │
└─────────────────────────────────────────────────────────┘
```

---

## Key Features

| Feature | Description |
|---|---|
| **CFO Hero Banner** | Full-width headline: overspend % + top 3 actions + annual savings |
| **Z-Score Anomaly Detection** | Statistical analysis on 3-month expense history per vendor/dept |
| **Math Breakdown** | Every finding shows exact formula: baseline → delta → z-score → confidence → annual risk |
| **Prioritized Actions** | GPT-4o ranks actions by monthly saving (₹); approval tier auto-computed |
| **3 Autonomous Actions** | Slack alert · vendor freeze · internal ticket — all fire automatically for AUTO tier |
| **Scenario Simulator** | Before/after cost curves with interactive sliders |
| **Loss Prevention** | Linear regression projects next 30/60/90-day spend with SLA breach alerts |
| **ROI Tracker** | Compares predicted vs actual savings after action execution |
| **CFO PDF Export** | PDFKit report: cover + executive summary + action plan + forecast |
| **Approval Workflows** | 4 tiers (AUTO/MANAGER/DIRECTOR/CFO) with reason codes, immutable audit log |

---

## Demo Scenarios (pre-seeded)

| Scenario | Company | Transactions | Expected Findings | Expected Savings |
|---|---|---|---|---|
| 1 | TechCorp India (SaaS) | 847 | 4 | ₹9.6L/year |
| 2 | MegaMart Operations (Retail) | 1,240 | 3 | ₹14.2L/year |
| 3 | PrecisionMfg Ltd (Manufacturing) | 620 | 3 (incl. SLA_RISK) | ₹18.4L/year |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ingest/csv` | Upload expense CSV |
| `POST` | `/api/ingest/pdf` | Upload bank statement PDF |
| `POST` | `/api/ingest/card-feed` | Generate mock card feed (demo) |
| `GET`  | `/api/analyze?sessionId=` | SSE stream — runs all 4 agents |
| `GET`  | `/api/findings?sessionId=` | Fetch anomaly findings |
| `GET`  | `/api/actions?sessionId=` | Fetch action log |
| `POST` | `/api/actions/[id]/approve` | Approve action with reason code |
| `POST` | `/api/actions/[id]/reject` | Reject action with mandatory note |
| `POST` | `/api/simulate` | Run what-if simulation for an action |
| `GET`  | `/api/forecast?sessionId=` | Get 30/60/90-day projections |
| `GET`  | `/api/roi?sessionId=` | Fetch realized savings records |
| `GET`  | `/api/export/pdf?sessionId=` | Download CFO report PDF |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `OPENAI_API_KEY` | ✅ | OpenAI API key |
| `OPENAI_MODEL` | ✅ | Model ID (default: `gpt-4o`) |
| `SLACK_WEBHOOK_URL` | ⚠️ | Slack webhook for live alerts |
| `SMTP_*` | Optional | Email for approval notifications |
| `THRESHOLD_AUTO` | Optional | Max INR for auto-execution (default: 500) |
| `THRESHOLD_MANAGER` | Optional | Max INR for manager approval (default: 5000) |
| `THRESHOLD_DIRECTOR` | Optional | Max INR for director approval (default: 20000) |
| `COMPANY_NAME` | Optional | Displayed in CFO banner and PDF |

---

## Tech Stack

- **Framework**: Next.js 14 (App Router, Server Components, SSE)
- **Language**: TypeScript strict mode
- **Database**: PostgreSQL + Prisma ORM
- **AI**: OpenAI GPT-4o (function calling)
- **Charts**: Chart.js + react-chartjs-2 + chartjs-plugin-annotation
- **PDF**: PDFKit
- **Styling**: Tailwind CSS + CSS custom properties (dark design system)
- **Fonts**: Syne · DM Sans · DM Mono · JetBrains Mono (Google Fonts)

---

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio
```

---

*Built for the AI CFO Hackathon — competing against 6,400 teams.*  
*"Finci doesn't just find waste. It prevents it."*
