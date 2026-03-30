# CyberOptimize: Enterprise SaaS Handoff Guide

Congratulations! You have a production-hardened, enterprise-grade AI SaaS platform optimized for the **Africa & MEA** cybersecurity markets. This document provides the high-level operational intelligence needed to manage, scale, and monetize the platform with maximum ROI.

## 🚀 1. Production Deployment Checklist
Before going live, verify the following are set in your environment:

- **NODE_ENV**: Must be set to `production`. This enables:
  - **Helmet Security**: Strict HTTP headers (HSTS, CSP, etc.).
  - **Rate Limiting**: Protects your API from DDoS and brute force (100 reqs / 15 mins).
  - **Silent Errors**: Hides stack traces from users to prevent info leaks.
- **SUPABASE_JWT_SECRET**: Required to verify auth tokens in production.
- **PAYPAL_BASE_URL**: Switch to `https://api-m.paypal.com` (Live) once Sandbox testing is complete.

## 💰 2. Monetization & Tier Management
The platform is currently configured with four operational tiers:
- **Starter**: 5 contracts limit, basic analysis.
- **Professional**: 50 contracts limit, standard ROI tracking.
- **Enterprise**: Unlimited contracts + **Premium Deep Scan** + **Board-Level Reports**.

### Managing the "High Return" Gate
To adjust these limits, modify the `const limits` object in:
- `frontend/src/components/Dashboard.jsx` (Front-end display)
- `backend/middleware/auth.middleware.js` (Back-end enforcement)

## 📉 3. Operator ROI: Token Optimization
The system uses a custom **AI Clause Cache** to protect your profit margins.
- **How it works**: Identical legal clauses (Boilerplate) are hashed. Subsequent analyses are served from the database without calling the OpenAI API.
- **Maintenance**: Periodically clear the `clause_cache` table if you update your AI prompts significantly to ensure users get the newest logic.

## 🌍 4. Regional Scaling (SADC/MEA Focus)
To enter new countries (e.g., Nigeria, Egypt, UAE), follow these steps:
1. **Gold Standard**: Add 3-5 standard clauses for that country to the `clause_library` table in Supabase.
2. **Reporter Service**: Update the prompt in `backend/services/reporter.service.js` to include the country's primary regulator (e.g., NDPR for Nigeria).
3. **UI Metrics**: Add the new regulator label to the `Regional Readiness` matrix in `Dashboard.jsx`.

## 🛡️ 5. Security Maintenance
- **Audit Logs**: All sensitive actions (Audit Pack downloads, Admin Approvals) are logged in the `audit_logs` table.
- **Secret Rotation**: Rotate your `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` every 90 days.
- **CORS**: In production, change the `origin: true` in `server.js` to your specific domain (e.g., `https://app.cyberoptimize.io`).

---
## 🧪 6. QA & Automated Testing
The platform includes a built-in zero-touch verification suite to ensure full-stack integrity.

- **Run Full Suite**: `npm run test:full` (Root directory).
- **What it verifies**:
  - **Auth**: Logic and JWT security.
  - **Contracts**: PDF analysis and AI Caching efficiency.
  - **Reports**: Strategic synthesis and consolidated ZIP exports.
  - **Billing**: Tier-gating logic (protecting Enterprise revenue).

**Standard Operating Procedure (SOP)**: 
*Verify, Optimize, Monetize.*
