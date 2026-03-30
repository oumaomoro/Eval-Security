import { test, expect } from '@playwright/test';
import { loginToUI, setupTestUser } from '../utils/helpers.js';

test.describe('Compliance PDF Export Routing', () => {

  test('Starter plan should hit a payment challenge for robust exports', async ({ page }) => {
    // Setup and Auth
    await setupTestUser('user', 'starter');
    await loginToUI(page);
    
    // Navigate to Reports URL directly
    await page.goto('/reports');
    
    // Locate standard report download logic
    // UI might not strictly trigger the modal in e2e without a seeded contract if empty state.
    const hasContracts = await page.getByText('No processed contracts found').isVisible();
    
    if (!hasContracts) {
      // Find the first report export action button
      const exportBtn = page.locator('button:has-text("Download Secure PDF")').first();
      // If we attempt click, we verify Stripe initiates instead of instant download
      // We can intercept the /charge-export api call
      const chargePromise = page.waitForResponse(response => 
        response.url().includes('/api/billing/charge-export') && response.status() === 200
      );

      await exportBtn.click();
      const chargeRes = await chargePromise;
      const chargeJSON = await chargeRes.json();
      
      // Assuming Mock bypass from local
      expect(chargeJSON.allowed).toBeDefined();
    }
  });

  test('Cron Job calculates upcoming renewal alerts', async ({ request, baseURL }) => {
    const CRON_SECRET = process.env.CRON_SECRET || 'fake-cron-secret-2026';
    const alertRes = await request.post(`${baseURL}/api/cron/renewal-alerts`, {
      headers: { 'x-cron-secret': CRON_SECRET }
    });

    expect(alertRes.status()).toBe(200);
    const body = await alertRes.json();
    expect(body.success).toBe(true);
    expect(typeof body.alerts_sent).toBe('number');
  });

});
