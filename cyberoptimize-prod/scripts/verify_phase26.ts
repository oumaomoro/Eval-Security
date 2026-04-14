import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Manual .env loader
try {
  const envPath = resolve(process.cwd(), ".env");
  const envFile = readFileSync(envPath, "utf-8");
  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/)
    if (match && !process.env[match[1]]) {
      let val = (match[2] || "").trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      process.env[match[1]] = val;
    }
  }
} catch {
  console.error("Warning: Could not load .env file");
}

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const API_BASE = 'http://127.0.0.1:3001/api';

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function apiCall(method: string, path: string, token: string, body?: object) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: any = null;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

async function verifyP26() {
  console.log('🚀 Starting Phase 26 Verification...\n');

  const testEmail = `verify_p26_${Math.random().toString(36).slice(2)}@cyberoptimize.test`;
  const testPassword = 'Password123!';

  try {
    // 1. Create a "Starter" test user (Limit: 20)
    console.log(`1. Provisioning Starter user: ${testEmail}`);
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: testEmail, password: testPassword, email_confirm: true,
      user_metadata: { first_name: 'Starter', last_name: 'Robot' }
    });
    if (authError) throw new Error(`User creation failed: ${authError.message}`);
    const userId = authData.user.id;

    // 2. Auth & Onboard
    const { data: signInData } = await adminClient.auth.signInWithPassword({ email: testEmail, password: testPassword });
    const token = signInData.session?.access_token!;
    const loginRes = await apiCall('POST', '/auth/login', token, { email: testEmail, password: testPassword });
    const userClientId = loginRes.data?.clientId;

    if (!userClientId) throw new Error("Could not retrieve clientId from login response");

    // 3. Verify Benchmarking Endpoint
    console.log('\n2. Verifying Marketplace Benchmarking Hub...');
    // Create a dummy contract first to have something to benchmark
    const contract = await apiCall('POST', '/contracts', token, {
        clientId: userClientId,
        vendorName: "E2E Vendor",
        productService: "Security Suite",
        category: "endpoint_protection",
        annualCost: 50000,
        status: "active"
    });


    
    if (!contract.ok) throw new Error(`Contract creation failed for benchmarking test: ${JSON.stringify(contract.data)}`);
    const contractId = contract.data.id;

    const benchmark = await apiCall('GET', `/contracts/${contractId}/benchmarking`, token);
    if (!benchmark.ok) throw new Error(`Benchmarking endpoint failed: ${JSON.stringify(benchmark.data)}`);
    console.log('   [DEBUG] Benchmark Data:', JSON.stringify(benchmark.data));
    console.log(`   ✅ Benchmark retrieved for ${benchmark.data.category}. Peer count: ${benchmark.data.peerCount}`);


    // 4. Verify Paywall Enforcement
    console.log('\n3. Verifying Paywall Hardening...');
    // Artificially saturate count to 20 for this test user
    const { error: updateError } = await adminClient.from('profiles').update({ contracts_count: 20 }).eq('id', userId);
    if (updateError) throw new Error(`Failed to simulate limit saturation: ${updateError.message}`);

    const blockedCreate = await apiCall('POST', '/contracts', token, {
        clientId: userClientId,
        vendorName: "Blocked Vendor",
        productService: "Premium Service",
        category: "saas",
        annualCost: 100000
    });


    if (blockedCreate.status === 402) {
        console.log(`   ✅ Paywall BLOCK verified (received 402 Payment Required).`);
        console.log(`   ✅ Message: ${blockedCreate.data.message}`);
    } else {
        throw new Error(`Paywall FAILED. Expected 402 but got ${blockedCreate.status}. Data: ${JSON.stringify(blockedCreate.data)}`);
    }

    // Cleanup
    await adminClient.auth.admin.deleteUser(userId);
    console.log('\n🎉 PHASE 26 VERIFICATION COMPLETE: ALL SYSTEMS NOMINAL.');
    process.exit(0);

  } catch (err: any) {
    console.error(`\n❌ VERIFICATION FAILED: ${err.message}`);
    process.exit(1);
  }
}

verifyP26();
