import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: 'cyberoptimize-prod/backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('🚀 Running Robust Reflection Audit...');
  const testId = '44307ad4-cefd-4ffe-8f79-29aed427b130'; // A valid UUID version 4
  
  try {
    const { data: insertData, error: insertError } = await supabase.from('profiles').insert({
      id: testId,
      email: `audit_robust_p25@cyberoptimize.test`,
      role: 'admin',
      subscription_tier: 'starter'
    });

    if (insertError) {
      console.error('❌ Insertion Failure:', insertError.message);
      console.error('⚠️ CONSTRAINT FEEDBACK:', insertError.details || 'No additional details');
    } else {
      console.log('✅ Insertion Successful! Cleaning up...');
      await supabase.from('profiles').delete().eq('id', testId);
    }

  } catch (err) {
    console.error('❌ Critical failure:', err.message);
  }
}

run();
