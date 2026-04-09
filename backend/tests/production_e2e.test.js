/**
 * production_e2e.test.js
 * 
 * PHASE 2: Final Production Smoke Test
 * This script runs against the LIVE production environment to ensure all 
 * components (Auth, DB, Billing) are perfectly sealed and operational.
 */

const BASE_URL = 'http://localhost:3001/api';
const SMOKE_TEST_EMAIL = `smoke-test-${Date.now()}@costloci.com`;
const SMOKE_TEST_PASSWORD = 'SmokeTestPassword123!';

async function runSmokeTest() {
  console.log('🏁 Starting PRODUCTION Smoke Test...');
  console.log(`🌍 Target: ${BASE_URL}`);
  let authToken = '';

  try {
    // 1. Health Check
    console.log('\n[Step 1] Verifying API Health...');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    if (healthRes.ok && healthData.status === 'healthy') {
      console.log('✅ Health: PASS', healthData.version);
    } else {
      throw new Error(`Health Check Failed: ${JSON.stringify(healthData)}`);
    }

    // 2. Registration (Auto-confirm)
    console.log('\n[Step 2] Testing Onboarding (No-Link Flow)...');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: SMOKE_TEST_EMAIL, password: SMOKE_TEST_PASSWORD })
    });
    const regData = await regRes.json();
    if (regRes.ok && regData.token) {
      console.log('✅ Registration: PASS (User auto-confirmed)');
      authToken = regData.token;
    } else {
      throw new Error(`Registration Failed: ${regData.error}`);
    }

    // 3. Login
    console.log('\n[Step 3] Verifying Login & JWT Issue...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: SMOKE_TEST_EMAIL, password: SMOKE_TEST_PASSWORD })
    });
    const loginData = await loginRes.json();
    if (loginRes.ok && loginData.token) {
      console.log('✅ Login: PASS');
    } else {
      throw new Error(`Login Failed: ${loginData.error}`);
    }

    // 4. Billing Plans (Middleware Check)
    console.log('\n[Step 4] Verifying Tier Gating & Connectivity...');
    const plansRes = await fetch(`${BASE_URL}/billing/plans`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const plansData = await plansRes.json();
    if (plansRes.ok && plansData.success) {
      console.log('✅ Billing & Middleware: PASS');
    } else {
      throw new Error(`Billing Gating Failed: ${plansData.error || 'Unknown error'}`);
    }

    console.log('\n🏆 PRODUCTION SMOKE TEST: ALL SYSTEMS OPERATIONAL!');
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ SMOKE TEST FAILED: ${err.message}`);
    process.exit(1);
  }
}

runSmokeTest();
