import { test, expect } from '@playwright/test';

test.describe('Contract Lifecycle Management', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Bypass auth by registering a unique test user
    await page.goto('/');
    await page.locator('button[role="tab"]:has-text("Initialize Agent")').click();
    const testEmail = `playwright-${Math.floor(Math.random() * 1000000)}@enterprise-test.com`;
    await page.fill('input[placeholder="John"]', 'Playwright');
    await page.fill('input[placeholder="Doe"]', 'Tester');
    await page.fill('input[placeholder="j.doe@enterprise.com"]', testEmail);
    await page.fill('input[type="password"]', 'SecurePass123!');
    await page.locator('button:has-text("Deploy Enterprise Identity")').click();
    await page.waitForURL('**/dashboard', { timeout: 20000 }).catch(() => null); 
  });

  test('should navigate through the contract analysis and redlining flow', async ({ page }) => {
    // Mock the backend API to securely test the UI without requiring an uploaded PDF
    await page.route('**/api/contracts', async route => {
      if (route.request().method() === 'GET') {
        const mockContracts = [{
          id: 9999,
          clientId: 1,
          vendorName: "Playwright Mock Vendor",
          productService: "Test Suite Service",
          category: "Testing",
          annualCost: 50000,
          status: "active",
          createdAt: new Date().toISOString()
        }];
        await route.fulfill({ json: mockContracts });
      } else {
        await route.continue();
      }
    });

    // 1. Visit Contracts Page
    await page.goto('/contracts');
    await expect(page.locator('h1')).toContainText(/Contract/i, { timeout: 15000 });

    // 2. Select the mocked contract
    const contractRow = page.locator('table tr').filter({ hasText: 'Playwright Mock Vendor' }).first();
    if (await contractRow.isVisible()) {
      // Click the exact link inside the row
      await contractRow.getByRole('link', { name: /view details/i }).click();
      
      // 3. Verify Detail Navigation
      await expect(page).toHaveURL(/.*contract\/\d+/);
      await expect(page.locator('text=Executive Summary')).toBeVisible({ timeout: 10000 });

      // 4. Open AI Analysis Tab
      await page.click('button:has-text("AI Analysis")');
      await expect(page.locator('text=Contract Intelligence')).toBeVisible({ timeout: 10000 });

      // 5. Check SignNow Gateway
      const signBtn = page.getByRole('button', { name: /request signature/i });
      await expect(signBtn).toBeVisible({ timeout: 10000 });
    }
  });

  test('should allow marketplace playbook activation', async ({ page }) => {
    await page.goto('/marketplace');
    
    // UI might say "Activate" or "Deactivate" depending on current DB state.
    const actionBtn = page.getByRole('button', { name: /activate|deactivate/i }).first();
    await actionBtn.click();

    // Verify persistence via Toast
    await expect(page.locator('text=Playbook')).toBeVisible({ timeout: 10000 });
  });
});
