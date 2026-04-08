import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env
const env = resolve(process.cwd(), ".env");
const lines = readFileSync(env, 'utf8').split('\n');
const envMap: any = {};
lines.forEach(l => {
  const [k, v] = l.split('=');
  if (k && v) envMap[k.trim()] = v.trim().replace(/^"|"$/g, '');
});

const s = createClient(envMap.SUPABASE_URL, envMap.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  console.log('Testing Supabase Service Role Power...');
  const { data, error } = await s.from('clients').insert({ 
    company_name: 'TEST_BYPASS_' + Date.now(),
    industry: 'Technology',
    status: 'active'
  }).select().single();

  if (error) {
    console.error('❌ FAILED:', error.message);
    if (error.code === '42501') console.error('   This is an RLS/Permission error. The key is NOT bypassing RLS.');
  } else {
    console.log('✅ SUCCESS: Key is bypassing RLS as expected. ID:', data.id);
  }
}

test();
