# Costloci Transactional Email & Verification Configuration

This document outlines the email architecture, required environment variables, verification link generation, local testing instructions, and E2E testing email bypass patterns for Costloci.

---

## 1. ️ Environment Variables

The following environment variables govern transactional emails and verification link generation:

| Variable | Required | Production Value | Description |
|---|---|---|---|
| `FRONTEND_URL` | **Yes** | `https://costloci.com` | Primary user-facing domain. Base for reset links and dashboard redirects. |
| `API_URL` | **Yes** | `https://api.costloci.com` | Primary backend API domain. Base for `/api/auth/verify?token=...` links. |
| `RESEND_API_KEY` | **Yes** | `re_...` | Resend API key for sending production emails via HTTPS. |

> [WARNING] **Server Startup Guard**: In production (`NODE_ENV=production`), if `FRONTEND_URL` is missing, `validateRequiredEnvVars()` logs a critical failure and terminates server startup (`process.exit(1)`).

---

## 2. Verification Link Construction

Verification links are constructed dynamically in `EmailService.ts` using `getApiUrl()` and `getFrontendUrl()` helpers:

```typescript
// 1. Email link sent to user inbox:
// https://api.costloci.com/api/auth/verify?token=${userId}
const apiHost = getApiUrl();
const verificationUrl = `${apiHost}/api/auth/verify?token=${token}`;

// 2. Upon user clicking link, GET /api/auth/verify verifies identity via Supabase Admin API:
await adminClient.auth.admin.updateUserById(token, { email_confirm: true });

// 3. User is redirected to frontend dashboard:
res.redirect(`${getFrontendUrl()}/auth?verified=true`);
```

---

## 3. ️ Local Testing Options

### Option 1: Mock Email Engine (Default fallback)
If `RESEND_API_KEY` is not set or set to dummy value (`re_123`), `EmailService.ts` automatically uses an internal mock engine:
- Log output: `️ [MOCK_EMAIL] Sending email to: user@example.com`
- Verification URL is printed directly to terminal logs.

### Option 2: Live Resend Key in Development
1. Obtain an API key from [resend.com](https://resend.com).
2. Set `RESEND_API_KEY=re_your_actual_key` in `.env`.
3. Set `FRONTEND_URL=http://localhost:3200`.
4. Register a user — verification email will land in your actual inbox.

---

## 4. Automated E2E Testing (Email Bypass Pattern)

In CI environments (e.g. GitHub Actions), testing real inbox delivery adds external latency and flakiness.

Instead, use **Option A (Email Bypass Pattern)** implemented in [`tests/e2e/registration-flow.spec.ts`](file:///c:/Users/Jack.Ouma/Downloads/New%20folder/Cyber-Optimize/Costloci/tests/e2e/registration-flow.spec.ts):

```typescript
// 1. Register new user via API
const registerRes = await request.post('/api/auth/register', {
 data: { email, password, firstName, lastName }
});
const { userId } = await registerRes.json();

// 2. Bypass email delivery by directly invoking the backend verification endpoint:
await request.get(`/api/auth/verify?token=${userId}`);

// 3. Authenticate in UI and confirm redirect to dashboard
await page.goto('/auth');
await page.fill('input[placeholder="you@company.com"]', email);
await page.fill('input[type="password"]', password);
await page.click('button:has-text("Sign In")');
await expect(page).toHaveURL(/(\/|\/dashboard)$/);
```

---

## 5. Manual Verification Checklist

Before deploying changes to production, execute this checklist:

1. [ ] **Set `FRONTEND_URL`**: Confirm `FRONTEND_URL=https://costloci.com` is set in Vercel & `.env`.
2. [ ] **Register User**: Register a new user at `https://costloci.com/auth`.
3. [ ] **Inspect Email**: Verify the email contains `https://api.costloci.com/api/auth/verify?token=...` or `https://costloci.com/api/auth/verify?token=...` (no `localhost:3200`).
4. [ ] **Click Link**: Click the link in the received email.
5. [ ] **Confirm Redirect**: Verify browser redirects to `https://costloci.com/auth?verified=true`.
6. [ ] **Sign In**: Log in with credentials and verify access to dashboard.
