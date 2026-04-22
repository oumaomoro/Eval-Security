import { test, expect } from '@playwright/test';

/**
 * COSTLOCI ULTIMATE CERTIFICATION SUITE
 * Covers 7 critical stages of the enterprise journey.
 */
test.describe('Costloci Full Enterprise Journey', () => {
  
  test('Stage 1: Authentication & Access Control', async ({ page }) => {
    const testEmail = `test_${Date.now()}@costloci.test`;
    await page.goto('/auth');
    await page.waitForSelector('text=Costloci', { timeout: 15000 });

    // Select the "Initialize Agent" (Register) tab
    await page.click('button[role="tab"]:has-text("Initialize Agent")');
    
    // Fill Registration Details
    await page.fill('input[placeholder="John"]', 'Test');
    await page.fill('input[placeholder="Doe"]', 'User');
    await page.fill('input[placeholder="j.doe@enterprise.com"]', testEmail);
    await page.fill('input[placeholder="Minimum 12 characters"]', 'Password123!');
    
    // Submit using the branded button
    await page.click('button:has-text("Deploy Enterprise Identity")');
    
    // Should verify session persistence and redirect to home (dashboard)
    // Looking for the "System Active" indicator or Dashboard header
    await expect(page).toHaveURL(/.*\//, { timeout: 15000 });
    await expect(page.locator('text=Enterprise Intelligence')).toBeVisible({ timeout: 15000 });
  });

  test('Stage 2: Contract Upload & AI Analysis', async ({ page }) => {
    // Note: Assuming a test file exists or using a mock
    await page.goto('/contracts');
    await page.setInputFiles('input[type="file"]', 'tests/fixtures/sample_contract.pdf');
    
    // Wait for AI processing
    await expect(page.locator('.loader')).toBeHidden({ timeout: 30000 });
    await expect(page.locator('table')).toContainText('Analyzed');
  });

  test('Stage 3: Insurance Extraction & Risk Scoring', async ({ page }) => {
    await page.goto('/insurance');
    await page.setInputFiles('#insurance-upload', 'tests/fixtures/cyber_policy.pdf');
    
    await expect(page.locator('text=Risk Score')).toBeVisible({ timeout: 45000 });
    const scoreText = await page.locator('.badge').innerText();
    expect(Number(scoreText.split(':')[1])).toBeGreaterThan(0);
  });

  test('Stage 4: Redlining & Remediation Flow', async ({ page }) => {
    await page.goto('/redlining');
    await page.click('.remediate-btn');
    
    // Wait for AI Redline suggestion
    await expect(page.locator('.diff-viewer')).toBeVisible();
    await page.click('text=Accept Suggestion');
    await expect(page.locator('text=Successfully Merged')).toBeVisible();
  });

  test('Stage 5: Marketplace Purchase (PayPal)', async ({ page }) => {
    await page.goto('/marketplace');
    await page.click('text=Purchase Clause');
    
    // Should verify redirect to PayPal/Checkout
    await expect(page).toHaveURL(/.*checkout/);
  });

  test('Stage 6: DPO Dashboard & Compliance Heatmap', async ({ page }) => {
    await page.goto('/dpo');
    await expect(page.locator('.recharts-radar-wrapper')).toBeVisible();
    await expect(page.locator('text=82%')).toBeVisible(); // Target readiness
  });

  test('Stage 7: Strategic Pack Generation', async ({ page }) => {
    await page.goto('/regulatory');
    await page.click('text=Generate Strategic Pack');
    
    // Verify cloud URL return
    await expect(page.locator('text=Your pack is ready')).toBeVisible();
    const downloadLink = await page.getAttribute('a.download-btn', 'href');
    expect(downloadLink).toContain('supabase.co/storage');
  });

  test('Stage 8: Automated Reporting & Scheduler Pipeline', async ({ page }) => {
    // Navigate to Intelligence/Reporting Bureau
    await page.goto('/reports');

    // Select the "Automated Schedules" tab
    await page.click('button[value="schedules"]');

    // Open Schedule Configurator
    await page.click('button:has-text("Initiate first schedule")');

    // Fill the configuration details
    await page.fill('input[id="sched-title"]', 'E2E Compliance Validation');
    await page.click('button[role="combobox"]');
    await page.click('div[role="option"]:has-text("Weekly Operational")');

    // Commit Schedule
    await page.click('button:has-text("Activate Schedule")');

    // Validate confirmation and presence in active routines
    await expect(page.locator('text=Schedule Created')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=E2E Compliance Validation')).toBeVisible();
  });
});
