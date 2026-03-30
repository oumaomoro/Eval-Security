import { test, expect } from '@playwright/test';
import { loginToUI } from '../utils/helpers.js';

test.describe('Annual Billing Feature', () => {

  test('should display accurate annual pricing toggle', async ({ page }) => {
    // 1. Authenticate & Navigate to /billing
    await loginToUI(page);
    await page.goto('/billing');

    // 2. Locate the precise 'month' vs 'year' toggle
    const toggleButton = page.locator('button[role="switch"]');
    
    // Expect switch to exist
    await expect(toggleButton).toBeVisible();

    // Starter plan default monthly price
    let starterPriceBox = page.locator('h3:has-text("Starter")').locator('..').locator('.text-5xl');
    await expect(starterPriceBox).toContainText('149'); // Default monthly

    // 3. Click the Yearly Switch
    await toggleButton.click();
    
    // 4. Verify the large number updates to 1430/yr mathematically
    // Since formula was Math.floor(149*12*0.8) = 1430
    starterPriceBox = page.locator('h3:has-text("Starter")').locator('..').locator('.text-5xl');
    await expect(starterPriceBox).toContainText('1,430');

    // Expected subtext equivalent of ~$119.17/mo equivalent
    const starterEquivalent = page.locator('h3:has-text("Starter")').locator('..').locator('.text-emerald-600');
    await expect(starterEquivalent).toContainText('/mo equivalent');
  });

  test('should pass correct `interval: year` payload to backend', async ({ page }) => {
    await loginToUI(page);
    await page.goto('/billing');
    
    // Toggle switch to Yearly
    const toggleButton = page.locator('button[role="switch"]');
    await toggleButton.click();

    // Select Stripe API Gateway if it exists in UI, else generic subscribe
    // The UI handles create-order on plan subscribe click.
    const createOrderPromise = page.waitForResponse(
      response => response.url().includes('/api/billing/create-order') && response.request().method() === 'POST'
    );
    
    // Click Subscribe for Starter
    await page.locator('h3:has-text("Starter")').locator('..').getByText('Subscribe', { exact: false }).first().click();
    
    // Verify POST payload contains 'year'
    const request = (await createOrderPromise).request();
    const payload = JSON.parse(request.postData());
    
    expect(payload.interval).toBe('year');
    expect(payload.plan_id).toBe('starter');
  });

});
