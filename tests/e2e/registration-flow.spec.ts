import { test, expect } from '@playwright/test';

test.describe('Registration & Email Verification Flow', () => {
 test('User can register, confirm email via bypass, and log in to dashboard', async ({ page, request }) => {
 const timestamp = Date.now();
 const testEmail = `e2e-user-${timestamp}@enterprise-test.com`;
 const testPassword = 'Password123!';
 const firstName = 'Automation';
 const lastName = 'User';

 // 1. Register new user via API endpoint
 const registerRes = await request.post('/api/auth/register', {
 data: {
 email: testEmail,
 password: testPassword,
 firstName,
 lastName
 }
 });

 expect(registerRes.ok()).toBeTruthy();
 const registerData = await registerRes.json();
 expect(registerData.userId).toBeDefined();
 const userId = registerData.userId;

 // 2. Bypass email verification by invoking the verification endpoint directly (simulating clicking email link)
 const verifyRes = await request.get(`/api/auth/verify?token=${userId}`, {
 maxRedirects: 0
 });
 expect([200, 302, 303, 307, 308]).toContain(verifyRes.status());

 // 3. Navigate to Auth UI and log in
 await page.goto('/auth');
 await page.waitForSelector('#root', { state: 'attached', timeout: 30000 });

 // Fill login credentials
 await page.fill('input[placeholder="you@company.com"]', testEmail);
 const passwordFields = page.locator('input[type="password"]');
 await passwordFields.first().fill(testPassword);

 // Submit Sign In form
 const signInBtn = page.locator('button').filter({ hasText: /^Sign In$/i });
 await signInBtn.click();

 // 4. Verify successful login and navigation to dashboard / main page
 await expect(page).toHaveURL(/(\/|\/dashboard)$/, { timeout: 15000 });
 await expect(page.locator('body')).toBeVisible();
 });
});
