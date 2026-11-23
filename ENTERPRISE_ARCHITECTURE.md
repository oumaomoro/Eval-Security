# Costloci: Enterprise Architecture

## 1. Overview

Costloci is an AI-powered cybersecurity contract management and cost optimization SaaS platform. It bridges legal document management, jurisdictional compliance (KDPA, GDPR, POPIA), and strategic risk governance.

### Core Value Pillars
- **AI-driven intelligence**: Deep contract analysis, deviation detection, and automated remediation.
- **Jurisdictional awareness**: African and international data protection standards.
- **Strategic governance**: Executive-level risk heatmaps, vendor scorecards, and benchmarking.
- **Enterprise resilience**: Self-healing infrastructure, billing telemetry, and audit ledgers.

---

## 2. Technical Architecture

### Frontend
- React 18 + Wouter (type-safe routing)
- Tailwind CSS with dark theme
- Shadcn/ui components
- Recharts for analytics and risk heatmapping
- TanStack React Query for server state

### Backend
- Node.js / Express with TypeScript
- Drizzle ORM with PostgreSQL
- OpenAI GPT-4o (structured JSON analysis)
- Centralized `IStorage` interface for data access

---

## 3. Governance Modules

### Compliance Intelligence
- **Ruleset Editor**: Create and manage jurisdictional standards (KDPA v2.0, internal policies).
- **Multi-Standard Comparison**: Parallel AI benchmarking against multiple regulatory frameworks.

### Risk and Vendor Governance
- **Strategic Heatmap**: Scatter-plot mapping vendor compliance vs. risk index.
- **Vendor Scorecards**: Automated grading (A-F) based on SLA performance, security posture, and compliance history.

### Enterprise Resilience Console
- **Global Health Matrix**: Real-time API latency, uptime, and AI accuracy monitoring.
- **Immutable Audit Ledger**: Persistent, traceable record of all compliance and administrative actions.
- **Billing Telemetry**: Usage vs. cost correlation for ROI reporting.

---

## 4. Cross-Platform Intelligence

### Microsoft Word Add-in
- Direct document analysis within the MS Word taskpane.
- Secure bridge to the Costloci AI engine via `/api/addin/analyze`.

---

## 5. Production Integrity

- Full TypeScript strict mode — zero `tsc` errors.
- Role-Based Access Control (RBAC) with JWT authentication.
- AI responses are memoized and cached for throughput.

---

## 6. Deployment

| Environment | Host | URL |
|-------------|------|-----|
| Frontend | Cloudflare Pages | https://costloci.com |
| Backend API | Vercel | https://api.costloci.com |
| Database / Auth | Supabase | PostgreSQL + JWT |

CI/CD is handled by GitHub Actions (`.github/workflows/deploy.yml`).
