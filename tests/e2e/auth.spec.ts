import { test, expect } from '@playwright/test';

test.describe('Platform Authentication', () => {

  test('should allow a new user to register and reach the dashboard', async ({ page }) => {
    await page.goto('/');

    // Page must load with Costloci branding
    await expect(page).toHaveTitle(/Costloci/i, { timeout: 15000 });

    // Switch to the Registration tab — label matches "Initialize Agent"
    const registerTab = page.locator('button[role="tab"]').filter({ hasText: /initialize agent/i });
    await registerTab.waitFor({ state: 'visible', timeout: 10000 });
    await registerTab.click();

    // Fill the registration form
    const randomSuffix = Date.now();
    const testEmail = `playwright-${randomSuffix}@enterprise-test.com`;

    await page.fill('input[placeholder="John"]', 'Playwright');
    await page.fill('input[placeholder="Doe"]', 'Tester');
    await page.fill('input[placeholder="j.doe@enterprise.com"]', testEmail);
    // Password fields - fill the first password field, then the confirm field
    const passwordFields = page.locator('input[type="password"]');
    await passwordFields.nth(0).fill('SecurePass123!');
    // If a confirm password field exists, fill it too
    const count = await passwordFields.count();
    if (count > 1) {
      await passwordFields.nth(1).fill('SecurePass123!');
    }

    // Submit
    const submitBtn = page.locator('button').filter({ hasText: /deploy enterprise identity/i });
    await submitBtn.click();

    // After registration the app redirects to /dashboard
    await page.waitForURL('**/dashboard', { timeout: 25000 }).catch(() => {});

    // Confirm dashboard loaded
    await expect(page).toHaveURL(/dashboard/, { timeout: 5000 });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
  });

  test('should redirect unauthenticated users away from the dashboard', async ({ page }) => {
    // Attempt to access a protected route directly without logging in
    await page.goto('/dashboard');

    // Either redirected to root/login, or a login prompt is shown
    await page.waitForURL(url => !url.pathname.includes('/dashboard'), { timeout: 10000 })
      .catch(() => {
        // If still on dashboard, at least the login form must be present
      });

    const onDashboard = page.url().includes('/dashboard');
    if (onDashboard) {
      // Login form must be present — user shouldn't see protected content
      const loginForm = page.locator('form').first();
      await expect(loginForm).toBeVisible({ timeout: 5000 });
    } else {
      // Successfully redirected to the auth page
      await expect(page).toHaveURL(/\/$|\/login|\/auth/, { timeout: 5000 });
    }
  });

  test('should show biometric button if supported', async ({ page }) => {
    await page.goto('/');
    // Biometric button is an optional enhancement — just ensure it doesn't crash the page
    const biometricBtn = page.locator('button').filter({ hasText: /biometric/i });
    const visible = await biometricBtn.isVisible();
    if (visible) {
      await expect(biometricBtn).toBeEnabled();
    }
    // Page must still be responsive
    await expect(page.locator('body')).toBeVisible();
  });

});
