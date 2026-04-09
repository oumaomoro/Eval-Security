---
description: Sync production keys and deploy Costloci Enterprise to Vercel/Cloudflare.
---

This workflow automates the synchronization of security keys and the deployment of the full-stack platform.

1. Ensure your local environment is up to date:
   ```cmd
   npm run build:prod
   ```

2. Initialize Vercel Environmental Sync (Backend):
   // turbo
   ```cmd
   node scripts/sync_vercel_env.js
   ```

3. Deploy Backend to Vercel:
   // turbo
   ```cmd
   vercel deploy --prod --yes
   ```

4. Deploy Frontend to Cloudflare:
   // turbo
   ```cmd
   npx wrangler pages deploy dist --project-name costloci-frontend
   ```

5. Verify Production Health:
   ```cmd
   node scripts/test_e2e_api.mjs
   ```
