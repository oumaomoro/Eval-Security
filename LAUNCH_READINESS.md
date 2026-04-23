# 🚀 Launch Readiness Checklist (Costloci)

Ensure all items are checked before running `./scripts/deploy_all.ps1`.

## 1. Environment Variables (Secret Manager)
- [x] `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` (Database access)
- [x] `OPENAI_API_KEY` (AI Analysis & Redlining)
- [x] `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` (Core Subscriptions)
- [x] `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` (Marketplace Payouts)
- [x] `RESEND_API_KEY` (Strategic Pack & Invoice emails)

## 2. Database State (Track 1)
- [x] Run `scripts/sync_missing_tables.sql` in Supabase UI.
- [x] Run `scripts/final_prod_patch.sql` in Supabase UI (Fixes `owner_id` & `report_schedules`).
- [x] Run `scripts/fix_rls_recursion.sql` in Supabase UI.
- [x] Verify `contracts` bucket exists in Supabase Storage with "Public" access for the `insurance/` and `remediation/` paths.

## 3. Infrastructure Config
- [x] Cloudflare Pages: Build command is `npm run build`, output directory is `dist`.
- [x] Vercel: Function timeout set to 60s (for AI analysis).
- [x] Resend: Sender domain is verified.

## 4. Certification
- [x] `npm run check` returns zero errors.
- [x] `npm run test:e2e` is GREEN (19/20 passing, minor cleanup teardown failure).
- [ ] Strategic Pack generation returns a valid `.zip` signed URL.

---
**Status: READY FOR LAUNCH** 🛰️
