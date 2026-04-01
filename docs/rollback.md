# Post-Deployment Rollback Procedures

This document outlines the systematic steps to revert the 8 Strategic Enhancements (Phase 24) without disrupting adjacent legacy systems in the Costloci platform.

## 1. Rolling Back Vercel/Redis Caching
If the `@vercel/kv` integration causes latency spikes or fails to interpret legacy tokens:
1. Navigate to **Vercel Settings > Environment Variables**.
2. Remove or rename `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to completely nullify the caching layer.
3. The `try/catch` wrappers within `analyzer.service.js` will immediately fall back to standard `gpt-4o-mini` API routing without code deployments.

## 2. Reverting Clause Diff Views (`react-diff-viewer`)
If the complex rendering libraries cause frontend build issues or memory leaks:
1. Revert `frontend/src/components/ClauseDiffViewer.jsx` via Git ref.
2. Remove `"react-diff-viewer"` from `frontend/package.json` dependencies.
3. Deploy frontend patch.

## 3. Disabling Usage-Based Overages
If overages erroneously bill enterprise tenants:
1. In `contract.routes.js`, disable the newly added Phase 24 Overage logic by reverting the `limit` variables or explicitly returning `isOverage = false`.
2. Access the database using Supabase SQL Editor:
```sql
UPDATE contract_overages SET billed = true WHERE billed = false; -- Halts incoming invoices
```
3. Remove the automated Vercel cron mapping representing `/api/cron/bill-overages`.

## 4. Reverting SQL Migrations
If structural dependencies fail, drop the Phase 24 objects aggressively, knowing it will purge Partner CRM mappings:
```sql
-- REVERT SCRIPT (WARNING: DESTRUCTIVE)
DROP TABLE IF EXISTS public.partners CASCADE;
DROP TABLE IF EXISTS public.contract_overages CASCADE;
DROP TABLE IF EXISTS public.export_charges CASCADE;

-- Revert columns
ALTER TABLE public.profiles DROP COLUMN api_access;
ALTER TABLE public.profiles DROP COLUMN api_key;
ALTER TABLE public.contracts DROP COLUMN last_renewal_alert_sent;
```

## 5. Safely Nullifying API Access 
If unauthorized scraping is suspected:
1. Suspend the endpoint by changing `authenticateToken` parameters or utilizing the Sentry DSN rate limiter.
2. Globally wipe API Keys:
```sql
UPDATE public.profiles SET api_key = null, api_access = false;
```
