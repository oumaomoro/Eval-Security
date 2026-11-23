# Launch Readiness Checklist

## 1. Environment Variables

- [ ] `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `OPENAI_API_KEY`
- [ ] `PAYPAL_CLIENT_ID` / `PAYPAL_SECRET`
- [ ] `RESEND_API_KEY`
- [ ] `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`
- [ ] `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID`

## 2. Database

- [ ] Run migrations in `supabase/migrations/` via the Supabase SQL editor.
- [ ] Verify `contracts` storage bucket exists with correct access policy.

## 3. Infrastructure

- [ ] Cloudflare Pages: build command `npm run build`, output `dist/public`.
- [ ] Vercel: function timeout 60s (required for AI analysis).
- [ ] Resend: sender domain verified.

## 4. Verification

- [ ] `npm run build` exits with code 0.
- [ ] `npm run test:unit` passes.
- [ ] `npm run check` (TypeScript) passes.
