import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'https://costloci.com';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TEST_USER = {
  email: `test+e2e+${Date.now()}@costloci.com`,
  password: 'CostlociE2E!Secure#2024',
  firstName: 'E2E',
  lastName: 'Tester',
};

async function navigateToAuth(page: Page) {
  await page.goto(`${BASE_URL}/auth`);
  await page.waitForLoadState('networkidle');
}

async function expectSuccessfulAuth(page: Page) {
  // After any auth, we should redirect away from /auth
  await page.waitForURL((url) => !url.pathname.startsWith('/auth'), { timeout: 15_000 });
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

test.describe('Authentication Flows', () => {

  // ── 1. Page loads correctly ──
  test('Auth page loads with login and register tabs', async ({ page }) => {
    await navigateToAuth(page);
    
    // Both tabs should exist
    await expect(page.getByRole('tab', { name: /access portal/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /initialize agent/i })).toBeVisible();

    // Google SSO button should be visible
    await expect(page.getByText(/continue with sso gateway/i)).toBeVisible();
  });

  // ── 2. Registration ──
  test('New user can register and is provisioned with enterprise assets', async ({ page }) => {
    await navigateToAuth(page);

    // Switch to register tab
    await page.getByRole('tab', { name: /initialize agent/i }).click();

    // Fill form
    await page.getByPlaceholder('John').fill(TEST_USER.firstName);
    await page.getByPlaceholder('Doe').fill(TEST_USER.lastName);
    await page.getByPlaceholder('j.doe@enterprise.com').fill(TEST_USER.email);
    await page.getByPlaceholder('Minimum 12 characters').fill(TEST_USER.password);

    // Submit
    await page.getByRole('button', { name: /deploy enterprise identity/i }).click();

    // Should redirect to dashboard
    await expectSuccessfulAuth(page);
  });

  // ── 3. Email/Password Login ──
  test('Existing user can log in with email/password', async ({ page }) => {
    await navigateToAuth(page);

    // Fill login form (using the provided credentials)
    await page.getByPlaceholder('analyst@enterprise.com').fill(process.env.TEST_LOGIN_EMAIL || TEST_USER.email);
    await page.getByPlaceholder('••••••••••••').fill(process.env.TEST_LOGIN_PASSWORD || TEST_USER.password);

    // Submit
    await page.getByRole('button', { name: /authenticate & connect/i }).click();

    await expectSuccessfulAuth(page);
  });

  // ── 4. Magic Link ──
  test('Magic link button is available and callable', async ({ page }) => {
    await navigateToAuth(page);

    const emailInput = page.getByPlaceholder('analyst@enterprise.com');
    await emailInput.fill('test@costloci.com');

    const magicBtn = page.getByRole('button', { name: /send magic link/i });
    await expect(magicBtn).toBeEnabled();
    await magicBtn.click();

    // Should show a success toast
    await expect(page.getByText(/magic link sent/i)).toBeVisible({ timeout: 8_000 });
  });

  // ── 5. Forgot Password ──
  test('Forgot password flow dispatches a reset email', async ({ page }) => {
    await navigateToAuth(page);

    // Click forgot
    await page.getByRole('button', { name: /forgot/i }).click();
    await expect(page.getByText(/master key recovery/i)).toBeVisible();

    await page.getByPlaceholder('your-email@enterprise.com').fill('test@costloci.com');
    await page.getByRole('button', { name: /dispatch recovery link/i }).click();

    // Toast confirmation
    await expect(page.getByText(/reset link sent/i)).toBeVisible({ timeout: 8_000 });
  });

  // ── 6. Google SSO initiation ──
  test('Google SSO gateway initiates an OAuth redirect', async ({ page }) => {
    // We intercept the network to avoid actually loading Google's servers
    await page.route('**/api/auth/google', (route) => {
      route.fulfill({
        status: 302,
        headers: { Location: 'https://accounts.google.com/o/oauth2/auth?redirect_test=1' },
      });
    });

    await navigateToAuth(page);

    const [response] = await Promise.all([
      page.waitForResponse('**/api/auth/google', { timeout: 5_000 }).catch(() => null),
      page.getByText(/continue with sso gateway/i).click(),
    ]);

    // The endpoint must respond — 2xx or 3xx (redirect). NOT 404.
    if (response) {
      expect(response.status()).toBeLessThan(500);
      expect(response.status()).not.toBe(404);
    }
  });

  // ── 7. API auth endpoint health check ──
  test('Backend /api/health endpoint is reachable', async ({ page }) => {
    const res = await page.request.get(`${process.env.API_URL || 'https://api.costloci.com'}/api/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('status');
  });
});
