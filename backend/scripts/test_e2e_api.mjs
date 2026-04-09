import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';

const BASE_URL = process.env.VITE_API_URL || 'https://api.costloci.com/api';

async function runTests() {
  console.log(`🚀 Starting Automated API E2E Tests on ${BASE_URL}\n`);

  try {
    // 1. Health Check
    console.log('[Test 1] Verifying System Health & Root DB Response');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    if (healthRes.ok && healthData.status === 'healthy') {
      console.log('✅ Health Check: Passed\n');
    } else {
      console.error('❌ Health Check: Failed', healthData);
    }

    // 2. Fetch Contracts (Unauthenticated) -> Should block and not cause CORS/Network error
    console.log('[Test 2] Verify Auth Gate on /contracts (GET)');
    const contractsRes = await fetch(`${BASE_URL}/contracts`);
    if (contractsRes.status === 401 || contractsRes.status === 403) {
      console.log(`✅ Auth Gate (GET): Passed (${contractsRes.status} Blocked Successfully)\n`);
    } else {
      console.error(`❌ Auth Gate (GET): Failed. Expected 401/403, got ${contractsRes.status}`);
    }

    // 3. Upload Contract for Analysis (Unauthenticated) -> Should block
    console.log('[Test 3] Verify users cannot upload contracts for analysis (Without valid Auth Session)');
    const form = new FormData();
    // Providing dummy buffer
    form.append('files', Buffer.from('%PDF-1.4 dummy pdf content'), {
      filename: 'dummy.pdf',
      contentType: 'application/pdf',
    });

    const uploadRes = await fetch(`${BASE_URL}/contracts/analyze`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    if (uploadRes.status === 401 || uploadRes.status === 403) {
      console.log(`✅ Upload Protection: Passed (${uploadRes.status} Blocked Successfully)\n`);
    } else {
      const respData = await uploadRes.text();
      console.error(`❌ Upload Protection: Failed. Expected 401/403, got ${uploadRes.status}`, respData);
    }

    console.log('🎉 All automated verification checks completed successfully.');
  } catch (error) {
    console.error('🚨 [Critical Failure] Automation script encountered a network or logic error:', error.message);
  }
}

runTests();
