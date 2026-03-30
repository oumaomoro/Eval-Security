import { test, expect } from '@playwright/test';
import { loginToUI, setupTestUser, supabase } from '../utils/helpers.js';

test.describe('Usage-Based Overage Billing', () => {

  test('should bypass hard caps and log contracts into contract_overages', async ({ page, request, baseURL }) => {
    // 1. Create a transient user
    const user = await setupTestUser('user', 'starter'); // Starter limit is 5
    
    // 2. We mock inserting 5 contracts directly into DB to reach limit instantly
    if (user.id !== '00000000-0000-0000-0000-000000000000') {
      const mockContracts = Array(5).fill({ user_id: user.id, vendor_name: 'Mock Test Corp', status: 'active', ai_analysis: {} });
      await supabase.from('contracts').insert(mockContracts);
    }
    
    // 3. Attempt 6th analysis API call directly mimicking UI upload
    // We send payload as FormData 
    const jwtToken = 'mock-jwt-if-local-testing'; // In robust E2E we fetch auth token dynamically
    
    // Skip if running without valid environment JWT proxy (CI standard)
    if (process.env.TEST_JWT) {
      const uploadRes = await request.post(`${baseURL}/api/contracts/analyze`, {
        headers: { 'Authorization': `Bearer ${process.env.TEST_JWT}` },
        multipart: {
          file: {
            name: 'excess_contract.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.from('%PDF-1.4\nFake')
          }
        }
      });
      
      // The new logic bypasses 403 blocks for "pro/starter" vs "enterprise"
      // Since it allows uploading, we should get 200 instead of 403
      expect(uploadRes.status()).toBe(200);

      // 4. Verify DB table `contract_overages`
      const { data: overages, error } = await supabase.from('contract_overages')
        .select('*').eq('user_id', user.id);
        
      expect(error).toBeNull();
      expect(overages.length).toBeGreaterThanOrEqual(1);
      expect(overages[0].billed).toBe(false);
    } else {
      console.log('Skipping overage actuals: Please provide TEST_JWT to simulate limit-hit bypass upload requests.');
    }
  });

  test('Cron Job should calculate monthly overages seamlessly', async ({ request, baseURL }) => {
    // 1. Trigger bill-overages Cron locally
    const CRON_SECRET = process.env.CRON_SECRET || 'fake-cron-secret-2026';
    const cronRes = await request.post(`${baseURL}/api/cron/bill-overages`, {
       headers: { 'x-cron-secret': CRON_SECRET }
    });

    const body = await cronRes.json();
    expect(cronRes.status()).toBe(200);
    expect(body.success).toBe(true);

    // If it billed anyone, test arrays
    if (body.billed_users > 0) {
       expect(body.summary.length).toBeGreaterThan(0);
       // Should have set db `billed: true`
    }
  });
});
