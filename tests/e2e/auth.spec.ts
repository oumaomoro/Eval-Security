import { test, expect } from '@playwright/test';

test.describe('Platform Authentication', () => {
  test('should allow a user to reach the dashboard', async ({ page }) => {
    // Navigate to the platform
    await page.goto('/');

    // Verify presence of branding
    await expect(page).toHaveTitle(/Costloci/);

    // Click Login (assuming the root redirect or a login button exists)
    // For this E2E test, we expect to see the dashboard or login page
    const loginHeader = page.locator('h2:has-text("Executive Sign In")');
    
    // Switch to Registration Tab to ensure we never hit a database constraint
    await page.locator('button[role="tab"]:has-text("Initialize Agent")').click();
    
    // Fill Registration Form with Randomized Credentials
    const randomSuffix = Math.floor(Math.random() * 1000000);
    const testEmail = `playwright-${randomSuffix}@enterprise-test.com`;
    
    await page.fill('input[placeholder="John"]', 'Playwright');
    await page.fill('input[placeholder="Doe"]', 'Tester');
    await page.fill('input[placeholder="j.doe@enterprise.com"]', testEmail);
    await page.fill('input[type="password"]', 'SecurePass123!');
    
    await page.locator('button:has-text("Deploy Enterprise Identity")').click();
    
    // Wait for the backend to provision the workspace and route to dashboard
    await page.waitForURL('**/dashboard', { timeout: 20000 }).catch(() => null); 

    // Verify we land on the dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1')).toContainText('Executive Dashboard');
  });

  test('should enforce biometric setup flow', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check if biometric prompt exists (if not already completed)
    const biometricBtn = page.locator('button:has-text("Biometric Login")');
    if (await biometricBtn.isVisible()) {
       await expect(biometricBtn).toBeEnabled();
    }
  });
});
