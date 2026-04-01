# Costloci Production Setup

A completely fully-scaffolded, production-ready full-stack cybersecurity contract analysis SaaS application leveraging React/Vite, Tailwind, Express, Supabase, and OpenAI.

## 🚀 Getting Started

### 1. Environment Configurations

Make sure to populate your respective `.env` files with valid credentials.

**Backend** (`costloci-prod/backend/.env`):
- `SUPABASE_URL` (Your Supabase Project URL)
- `SUPABASE_ANON_KEY` (Used for auth verification fallback)
- `SUPABASE_SERVICE_ROLE_KEY` (Required for full admin database read/write)
- `OPENAI_API_KEY` (Required for AI analysis)
- `PAYPAL_CLIENT_ID` (Global Sandbox/Live)
- `PAYPAL_CLIENT_SECRET` (Global Sandbox/Live)
- `PAYSTACK_SECRET_KEY` (African Regional Gateway)
- `FRONTEND_URL` (Required for payment redirects, e.g., http://localhost:5180)

**Frontend** (`costloci-prod/frontend/.env`):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PAYPAL_CLIENT_ID`

### 2. Database Setup
A full PostgreSQL schema is provided. Run `database/schema.sql` in your Supabase SQL Editor. It creates 8 fully-relational tables with Row Level Security (RLS) policies and automatic trigger functions.

### 3. Available Scripts

Run the project in two separate terminal windows.

#### Backend (Node.js/Express)
```bash
cd backend
npm install
npm run dev
```

#### Frontend (React/Vite)
```bash
cd frontend
npm install
npm run dev
```

### 4. Automated Testing (Full Stack)
Costloci includes a zero-touch, full-lifecycle verification suite. To run the complete smoke test:
```bash
npm run test:full
```
This automated suite verifies **Auth security**, **AI Contract Analysis**, **ROI caching**, **Strategic PDF/ZIP generation**, and **Enterprise Tier Gating** in a single pass.

### 4. Architecture Features
- **Frontend**: React + Vite, Tailwind CSS, customized context providers for authentication and theming, PayPal and Paystack checkout integrations.
- **Backend**: Express + Node.js. Nine isolated modules (`auth`, `contracts`, `dashboard`, `clauses`, `risk`, `savings`, `reports`, `billing`, `integrations`).
- **Agile SaaS Architecture**: Modular Billing Engine (Multi-Gateway) and Cloud-Persisted White-Labeling.
- **AI Core**: Native `pdf-parse` extraction streaming to OpenAI's GPT-4o, wrapped with SHA-256 caching layers and sector-specific DPA/MSA logic.
- **Strategic Reporting**: Fully synthesized board-level summaries (Strategic Briefs) and Board PDFs focused on capital preservation.
- **Audit Portability**: Consolidated ZIP Audit Packs (original PDFs + JSON + CSV) for regulatory compliance (IRA, CMA, KDPA).
- **Hardening**: Built-in `helmet` security headers, `express-rate-limit` protection, and global production-tier error handling.

## 🎨 Enterprise White-Labeling (MSP Mode)
Costloci enables full agency white-labeling. MSPs can customize the following via **Settings**:
- **Branded Logos**: Custom logos applied to the Workspace Sidebar and all PDF Reports.
- **Primary Design Tokens**: Organization-specific colors injected into the UI and Report accents.
- **Legal IP Rights Holder**: Professional watermarking of audit reports with your agency's legal name.
- **Future-Proof Watermarking**: Immutable 'CONFIDENTIAL' overlays for high-risk analysis.

## 🌍 Africa & MEA Compliance Readiness
The platform is natively optimized for the following regulatory frameworks:
- **IRA (Kenya)**: Insurance Regulatory Authority outsourcing guidelines.
- **CMA (East Africa)**: Capital Markets Authority financial processing standards.
- **POPIA (South Africa)**: SADC data sovereignty and processing requirements.
- **KDPA (Kenya)**: Data Protection Act compliance mapping.
- **CBK (Central Bank of Kenya)**: Banking outsourcing notification standards (2024).

---
**Standard Operating Procedure (SOP)**:
Always run `npm run lint` before building for production. Set `NODE_ENV=production` for all live deployments.
