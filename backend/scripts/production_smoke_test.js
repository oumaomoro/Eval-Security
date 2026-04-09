/**
 * Costloci: Production Smoke Test
 * This script pings all major API endpoints to verify the backend is operational and hardened.
 * Usage: node scripts/production_smoke_test.js
 */
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = process.env.RENDER_EXTERNAL_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001');

const ENDPOINTS = [
  { path: '/api/health', method: 'GET', alias: 'Health Check' },
  { path: '/api/auth/me', method: 'GET', alias: 'Auth Status' },
  { path: '/api/contracts/', method: 'GET', alias: 'Contract List (Auth Protected)' },
  { path: '/api/billing/plans', method: 'GET', alias: 'Billing Plans' }
];


async function runSmokeTest() {
  console.log(`\n🚀 Starting Production Smoke Test on ${BASE_URL}...\n`);
  let passed = 0;
  let failed = 0;

  for (const endpoint of ENDPOINTS) {
    try {
      console.log(`📡 testing [${endpoint.method}] ${endpoint.path} (${endpoint.alias})...`);
      
      const response = await fetch(`${BASE_URL}${endpoint.path}`, {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' }
      });

      const emoji = response.ok ? '✅' : response.status < 500 ? 'ℹ️' : '❌';
      console.log(`${emoji} Status: ${response.status} (${response.statusText})`);
      
      if (response.status < 500) {
        passed++;
      } else {
        failed++;
        console.error(`🔴 Critical Error at ${endpoint.path}: Internal Server Error.`);
      }
    } catch (err) {
      console.error(`❌ Connection Failure for ${endpoint.path}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n🏁 Test Complete: ${passed} passed, ${failed} failed.\n`);
  
  if (failed > 0) {
    console.error('⚠️  CRITICAL: Production backend has identified failures.');
    process.exit(1);
  } else {
    console.log('✨ SUCCESS: Backend is hardened and operational.');
    process.exit(0);
  }
}

runSmokeTest();

