import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from backend BEFORE anything else
dotenv.config({ path: join(__dirname, '../backend/.env') });

async function runJourney() {
  console.log('🚀 Starting API Verification Journey...');
  
  // Dynamic import to ensure process.env is populated before supabase initialization
  const { supabase } = await import('../backend/services/supabase.service.js');
  const IS_PROD = process.env.PROD === 'true';
  const API_URL = IS_PROD ? 'https://api.costloci.com/api' : 'http://localhost:3001/api';

  console.log(`🌐 Target: ${API_URL}`);

  try {
    // 1. Authenticate using Supabase Auth to get a valid JWT
    console.log('1. Authenticating test user...');
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: 'file75556@gmail.com',
      password: 'password123' // This should match your production user passcode
    });

    if (authErr) {
      console.error('❌ Auth Error:', authErr.message);
      return;
    }

    const token = authData.session.access_token;
    console.log('✅ Authenticated successfully.');

    // 2. Fetch Dashboard stats
    console.log('2. Fetching Dashboard Metrics...');
    const dashRes = await fetch(`${API_URL}/dashboard/metrics`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!dashRes.ok) {
        console.error('❌ Dashboard Error:', await dashRes.text());
        return;
    }
    const dashData = await dashRes.json();
    console.log('✅ Dashboard loaded:', dashData);

    // 3. Upload a Contract
    console.log('3. Uploading Test Contract...');
    const form = new FormData();
    form.append('file', fs.createReadStream('./test_agreement.pdf'));

    const uploadRes = await fetch(`${API_URL}/contracts/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: form
    });

    if (!uploadRes.ok) {
        console.error('❌ Upload Error:', await uploadRes.text());
        return;
    }
    
    const uploadData = await uploadRes.json();
    console.log('✅ Contract uploaded and analyzed:', uploadData);

    // 4. Test External Webhook / Billing
    console.log('4. Checking billing plans endpoint...');
    const billingRes = await fetch(`${API_URL}/billing/plans`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!billingRes.ok) {
        console.error('❌ Billing Error:', await billingRes.text());
        return;
    }
    console.log('✅ Billing plans accessible.');

    console.log('🎉 Full User Journey API Validation Passed!');
  } catch (err) {
    console.error('❌ Journey failed with exception:', err);
  }
}

runJourney();
