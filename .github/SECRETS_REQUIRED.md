# Costloci — Required GitHub Actions Secrets

Go to **GitHub → Settings → Secrets and variables → Actions → New repository secret** and add each of the following.

If any are missing, the workflow will fail at the **Pre-flight Checks** step with a clear list of what is missing — before any deployment is attempted.

---

## Required Secrets

| Secret Name | Where to Get It | Value |
|---|---|---|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens | `vck_4rUMBpgG6u0EuJIBgZrxNSDfZj9WCGx...` |
| `VERCEL_ORG_ID` | Vercel → Settings → General → Team ID | `team_e3jJx67pD2yUoOEFo8QBBt2q` |
| `VERCEL_BACKEND_PROJECT_ID` | Vercel → Backend Project → Settings → Project ID | `prj_pWdvodBRU6wg1mFFMGDHIx9KD6SJ` |
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens | `cfut_BDDw2igsCOTQ9P9vsKi0OcNjXOBRtSh4t2f2K...` |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare → Dashboard → Account ID (right sidebar) | `8dc05e6cc0ee7377c2f17f4ff69baec9` |
| `VITE_API_URL` | Fixed value | `https://api.costloci.com` |
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API | `https://ulercnwyckrcjcnrenzz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | (anon/public key) |

---

## Deployment Architecture

```
push to main
     │
     ▼
[Pre-flight] — fails fast if any secret is missing
     │
     ▼
[Build] — npm run check + npm run build + output verification
     │
     ├──────────────────────────────┐
     ▼                              ▼
[deploy-frontend]           [deploy-backend]
Cloudflare Pages             Vercel (Production)
dist/public → CDN          cyberoptimize-prod/backend
```

## Notes

- **Concurrency lock** is active — pushes during a live deployment queue rather than collide.
- **Pre-flight** checks all secrets *first* so you get a clear error before any deployment runs.
- **Build output verification** confirms `dist/public/` and `dist/index.cjs` exist before the artifact is uploaded.
- Frontend and backend deploy **in parallel** after the build job — cutting total deploy time roughly in half.
