# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: contract-workflow.spec.ts >> Contract Lifecycle Management >> should allow marketplace playbook activation
- Location: tests\e2e\contract-workflow.spec.ts:79:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3001/auth
Call log:
  - navigating to "http://localhost:3001/auth", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect, type Page } from '@playwright/test';
  2   | 
  3   | // ─── Shared helper: register a new user and land on the dashboard ────────────
  4   | async function registerAndLogin(page: Page): Promise<string> {
> 5   |   await page.goto('/auth');
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3001/auth
  6   |   const randomSuffix = Date.now();
  7   |   const testEmail = `playwright-${randomSuffix}@enterprise-test.com`;
  8   | 
  9   |   const registerTab = page.locator('button[role="tab"]').filter({ hasText: /initialize agent/i });
  10  |   await registerTab.waitFor({ state: 'visible', timeout: 10000 });
  11  |   await registerTab.click();
  12  | 
  13  |   await page.fill('input[placeholder="John"]', 'Playwright');
  14  |   await page.fill('input[placeholder="Doe"]', 'Tester');
  15  |   await page.fill('input[placeholder="j.doe@enterprise.com"]', testEmail);
  16  |   const pwFields = page.locator('input[type="password"]');
  17  |   await pwFields.nth(0).fill('SecurePass123!');
  18  |   if (await pwFields.count() > 1) await pwFields.nth(1).fill('SecurePass123!');
  19  | 
  20  |   await page.locator('button').filter({ hasText: /deploy enterprise identity/i }).click();
  21  |   await page.waitForURL(url => url.pathname === '/', { timeout: 25000 }).catch(() => {});
  22  | 
  23  |   return testEmail;
  24  | }
  25  | 
  26  | // ─── Suite ───────────────────────────────────────────────────────────────────
  27  | test.describe('Contract Lifecycle Management', () => {
  28  | 
  29  |   test('should navigate through the contract analysis and redlining flow', async ({ page }) => {
  30  |     await registerAndLogin(page);
  31  | 
  32  |     // Intercept contract list to avoid needing real data in CI
  33  |     await page.route('**/api/contracts*', async route => {
  34  |       if (route.request().method() === 'GET') {
  35  |         await route.fulfill({
  36  |           status: 200,
  37  |           contentType: 'application/json',
  38  |           body: JSON.stringify([{
  39  |             id: 9999,
  40  |             clientId: 1,
  41  |             vendorName: 'Playwright Mock Vendor',
  42  |             productService: 'Test Suite Service',
  43  |             category: 'Testing',
  44  |             annualCost: 50000,
  45  |             status: 'active',
  46  |             createdAt: new Date().toISOString(),
  47  |           }]),
  48  |         });
  49  |       } else {
  50  |         await route.continue();
  51  |       }
  52  |     });
  53  | 
  54  |     // Navigate to contracts
  55  |     await page.goto('/contracts');
  56  |     await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
  57  | 
  58  |     // Check if the mock contract appears
  59  |     const contractRow = page.locator('text=Playwright Mock Vendor').first();
  60  |     const rowVisible = await contractRow.isVisible({ timeout: 8000 }).catch(() => false);
  61  | 
  62  |     if (rowVisible) {
  63  |       // Try clicking a details link near the vendor row
  64  |       const viewLink = page.locator('a, button').filter({ hasText: /view|details/i }).first();
  65  |       if (await viewLink.isVisible()) {
  66  |         await viewLink.click();
  67  |         await page.waitForTimeout(2000);
  68  |         // We should be on a contract detail URL or still on contracts
  69  |         const url = page.url();
  70  |         expect(url).toMatch(/contract|contracts/i);
  71  |       }
  72  |     } else {
  73  |       // No mocked row visible — the table rendered with the real (possibly empty) data
  74  |       // Verify the page itself is functional
  75  |       await expect(page.locator('main, [role="main"], #root')).toBeVisible({ timeout: 5000 });
  76  |     }
  77  |   });
  78  | 
  79  |   test('should allow marketplace playbook activation', async ({ page }) => {
  80  |     await registerAndLogin(page);
  81  | 
  82  |     // Intercept marketplace API to avoid state-dependent failures
  83  |     await page.route('**/api/playbooks*', async route => {
  84  |       if (route.request().method() === 'GET') {
  85  |         await route.fulfill({
  86  |           status: 200,
  87  |           contentType: 'application/json',
  88  |           body: JSON.stringify([{
  89  |             id: 1,
  90  |             name: 'KDPA Compliance Playbook',
  91  |             category: 'Compliance',
  92  |             isActive: false,
  93  |             description: 'Automates KDPA 2019 compliance checks.',
  94  |           }]),
  95  |         });
  96  |       } else {
  97  |         await route.continue();
  98  |       }
  99  |     });
  100 | 
  101 |     await page.goto('/marketplace');
  102 |     // Wait for page to settle
  103 |     await page.waitForTimeout(2000);
  104 | 
  105 |     // Page must be visible regardless of real data state
```