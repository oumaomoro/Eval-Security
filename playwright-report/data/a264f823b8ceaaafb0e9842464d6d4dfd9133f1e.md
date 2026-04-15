# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Platform Authentication >> should redirect unauthenticated users away from the dashboard
- Location: tests\e2e\auth.spec.ts:44:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3001/contracts
Call log:
  - navigating to "http://localhost:3001/contracts", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Platform Authentication', () => {
  4  | 
  5  |   test('should allow a new user to register and reach the dashboard', async ({ page }) => {
  6  |     await page.goto('/auth');
  7  | 
  8  |     // Page must load with Costloci branding
  9  |     await expect(page).toHaveTitle(/Costloci/i, { timeout: 15000 });
  10 | 
  11 |     // Switch to the Registration tab — label matches "Initialize Agent"
  12 |     const registerTab = page.locator('button[role="tab"]').filter({ hasText: /initialize agent/i });
  13 |     await registerTab.waitFor({ state: 'visible', timeout: 10000 });
  14 |     await registerTab.click();
  15 | 
  16 |     // Fill the registration form
  17 |     const randomSuffix = Date.now();
  18 |     const testEmail = `playwright-${randomSuffix}@enterprise-test.com`;
  19 | 
  20 |     await page.fill('input[placeholder="John"]', 'Playwright');
  21 |     await page.fill('input[placeholder="Doe"]', 'Tester');
  22 |     await page.fill('input[placeholder="j.doe@enterprise.com"]', testEmail);
  23 |     // Password fields - fill the first password field, then the confirm field
  24 |     const passwordFields = page.locator('input[type="password"]');
  25 |     await passwordFields.nth(0).fill('SecurePass123!');
  26 |     // If a confirm password field exists, fill it too
  27 |     const count = await passwordFields.count();
  28 |     if (count > 1) {
  29 |       await passwordFields.nth(1).fill('SecurePass123!');
  30 |     }
  31 | 
  32 |     // Submit
  33 |     const submitBtn = page.locator('button').filter({ hasText: /deploy enterprise identity/i });
  34 |     await submitBtn.click();
  35 | 
  36 |     // After registration the app redirects to / which renders the dashboard
  37 |     await page.waitForURL(url => url.pathname === '/', { timeout: 25000 }).catch(() => {});
  38 | 
  39 |     // Confirm dashboard loaded
  40 |     await expect(page).toHaveURL(/\/$/, { timeout: 5000 });
  41 |     await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
  42 |   });
  43 | 
  44 |   test('should redirect unauthenticated users away from the dashboard', async ({ page }) => {
  45 |     // Attempt to access a protected route directly without logging in
> 46 |     await page.goto('/contracts');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3001/contracts
  47 | 
  48 |     // Successfully redirected to the auth page
  49 |     await expect(page).toHaveURL(/\/auth/, { timeout: 10000 });
  50 | 
  51 |     const onAuth = page.url().includes('/auth');
  52 |     if (onAuth) {
  53 |       // Login form must be present
  54 |       const loginForm = page.locator('button').filter({ hasText: /authenticate & connect/i });
  55 |       await expect(loginForm).toBeVisible({ timeout: 5000 });
  56 |     }
  57 |   });
  58 | 
  59 |   test('should show biometric button if supported', async ({ page }) => {
  60 |     await page.goto('/auth');
  61 |     // Biometric button is an optional enhancement — just ensure it doesn't crash the page
  62 |     const biometricBtn = page.locator('button').filter({ hasText: /biometric/i });
  63 |     const visible = await biometricBtn.isVisible();
  64 |     if (visible) {
  65 |       await expect(biometricBtn).toBeEnabled();
  66 |     }
  67 |     // Page must still be responsive
  68 |     await expect(page.locator('body')).toBeVisible();
  69 |   });
  70 | 
  71 | });
  72 | 
```