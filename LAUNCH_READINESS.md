# 🚀 Launch Readiness Checklist (Costloci)

Ensure all items are checked before running `./scripts/deploy_all.ps1`.

## 1. Environment Variables (Secret Manager)
- [ ] `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` (Database access)
- [ ] `OPENAI_API_KEY` (AI Analysis & Redlining)
- [ ] `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` (Core Subscriptions)
- [ ] `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` (Marketplace Payouts)
- [ ] `RESEND_API_KEY` (Strategic Pack & Invoice emails)

## 2. Database State (Track 1)
- [ ] Run `scripts/sync_missing_tables.sql` in Supabase UI.
- [ ] Run `scripts/fix_rls_recursion.sql` in Supabase UI.
- [ ] Verify `contracts` bucket exists in Supabase Storage with "Public" access for the `insurance/` and `remediation/` paths.

## 3. Infrastructure Config
- [ ] Cloudflare Pages: Build command is `npm run build`, output directory is `dist`.
- [ ] Vercel: Function timeout set to 60s (for AI analysis).
- [ ] Resend: Sender domain is verified.

## 4. Certification
- [ ] `npm run check` returns zero errors.
- [ ] `npm run test:e2e` is GREEN (All 7 stages passing).
- [ ] Strategic Pack generation returns a valid `.zip` signed URL.

---
**Status: READY FOR LAUNCH** 🛰️
