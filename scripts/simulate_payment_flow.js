import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

async function automatePaymentTest() {
  const { supabase } = await import('../backend/services/supabase.service.js');
  console.log('🤖 Starting Automated PayPal Payment Webhook Verification...');
  const testEmail = 'file75556@gmail.com';
  const API_URL = 'https://api.costloci.com/api/billing/webhook/paypal';

  try {
    // 1. Resolve or Create Test User
    let userId;
    let customId;
    console.log('[1/4] Provisioning Test User in Supabase...');
    const { data: usersData } = await supabase.auth.admin.listUsers();
    let existingUser = usersData.users.find(u => u.email === testEmail);
    
    if (!existingUser) {
        const { data, error } = await supabase.auth.admin.createUser({
            email: testEmail, password: 'password123', email_confirm: true,
            user_metadata: { role: 'analyst', tier: 'free' }
        });
        if (error) throw new Error('User creation failed: ' + error.message);
        userId = data.user.id;
    } else {
        userId = existingUser.id;
    }

    const { error: upsertErr } = await supabase.from('profiles').upsert({ id: userId, tier: 'free', role: 'analyst', paypal_subscription_id: null });
    if (upsertErr) console.error("❌ Profile Upsert Failed:", upsertErr.message);
    else console.log(`✅ User ${testEmail} forced to Tier: FREE`);
    
    // 2. Synthesize a PayPal Webhook Payload
    console.log('[2/4] Firing Synthetic Webhook directly to the Costloci Live Backend...');
    const API_URL = 'https://api.costloci.com/api/billing/webhook/paypal';
    const fakeSubId = 'I-MOCKPAYPALSUB123';
    const webhookPayload = {
      event_type: "BILLING.SUBSCRIPTION.ACTIVATED",
      resource: {
        id: fakeSubId,
        custom_id: userId,
        status: "ACTIVE",
        plan_id: process.env.PAYPAL_PLAN_PRO_MONTH || "P-MOCK"
      }
    };

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload)
    });

    if (!res.ok) {
        throw new Error(`Webhook Endpoint failed with Status: ${res.status} - ${await res.text()}`);
    }
    console.log('✅ Webhook securely delivered and processed (HTTP 200).');

    // 3. Verify Database Upgrades
    console.log('[3/4] Verifying Tier Escalation in Supabase Context... (waiting 3s for hook processing)');
    await new Promise(resolve => setTimeout(resolve, 3000)); 

    const { data: profile, error: fetchErr } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    
    if (fetchErr) {
        console.error("❌ Error fetching profile:", fetchErr.message);
    } else if (!profile) {
        console.error("❌ ERROR: Profile row disappeared or doesn't exist for user ID:", userId);
    } else if (profile.tier === 'pro' && profile.paypal_subscription_id === fakeSubId) {
        console.log(`🎉 SUCCESS: User profile seamlessly bumped to [PRO] tier perfectly!`);
        console.log(`      Provider: ${profile.billing_provider}`);
        console.log(`      Sub ID:   ${profile.paypal_subscription_id}`);
        console.log(`      Status:   ${profile.status_note}`);
    } else {
        console.error(`❌ FAILED: User tier did not change properly. Current Tier: [${profile.tier}], Sub_ID: [${profile.paypal_subscription_id}]`);
    }
    
    console.log('\n✅ Fully automated Billing Flow tested across Backend + Supabase Context!');
  } catch (err) {
    console.error('❌ Automation Error:', err);
  }
}

automatePaymentTest();
