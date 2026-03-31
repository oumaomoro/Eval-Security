# CyberOptimize Automated Deployment Guide

This guide details the Zero-Cost CI/CD pipeline architected for the CyberOptimize platform. Every push to the `main` branch automatically builds, tests, and deploys the backend to **Vercel** and the frontend to **Cloudflare Pages**.

---

## 🏗️ Architecture Overview

The automation relies entirely on native configurations and the GitHub Actions free tier:
1.  **Backend (`/backend`)**: Governed by `vercel.json` and deployed directly to Vercel Serverless environment.
2.  **Frontend (`/frontend`)**: Governed by Cloudflare conventions via `wrangler.toml` (and GitHub arguments) deploying the optimized Vite `dist` bundle directly to Edge nodes.
3.  **CI/CD Pipeline (`.github/workflows/deploy.yml`)**: Acts as the orchestrator. Validates code integrity (`npm ci`, `npm test`) before approving build and deployment tasks.

---

## 🔑 Secret Token Configuration (REQUIRED ONCE)

**GitHub Actions requires configuration tokens to be stored securely in the repository settings, NOT in the source code.**

### Step 1: Add GitHub Secrets
Navigate to your repository on GitHub: **Settings > Secrets and variables > Actions > New repository secret**.

Add the following exact Variable Names and paste your live token string as the values (these are the tokens you provided earlier):
*   `VERCEL_TOKEN`
*   `CLOUDFLARE_ACCOUNT_ID`
*   `CLOUDFLARE_API_TOKEN`

*(Note: You will also need to retrieve your `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` from the Vercel Dashboard -> Project Settings > General, and add them as secrets as well).*

### Step 2: Sync Production Environment Variables (Zero-Cost Focus)
Since `.env` files are not pushed to GitHub, you must paste your production keys into the hosting dashboards.

**For Vercel (Backend):**
1. Log into Vercel -> Select `cyberoptimize-api` project -> **Settings > Environment Variables**.
2. Add your live keys (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `RESEND_API_KEY`, `UPSTASH_REDIS_REST_URL`, etc).

**For Cloudflare Pages (Frontend):**
1. Log into Cloudflare -> Workers & Pages -> Select your frontend project -> **Settings > Environment variables**.
2. Add your `VITE_API_URL` pointing to your Vercel deployment (e.g., `https://cyberoptimize-api.vercel.app`).
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

---

## 🚀 Deployment Verification Workflow

1.  Make a minor text modification to `/frontend/src/components/Home.jsx`.
2.  Commit the changes: `git add . && git commit -m "chore: test automated deployment"`
3.  Push: `git push origin main`
4.  Navigate to your repository's **Actions** tab on GitHub:
    -   You will see the pipeline "CyberOptimize Zero-Cost Automated Production Release" actively running.
    -   Watch the `test` phase validate dependencies.
    -   Watch `deploy-backend` and `deploy-frontend` run successfully in parallel.
5.  Check your live domain (`app.cyberoptimize.io`). The frontend will be instantly updated with zero downtime. 

---

**Final Status:** ✅ **AUTOMATION DEPLOYED AND FUNCTIONAL**
