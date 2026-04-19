const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function verifyAnon() {
  console.log('🧪 Verifying RLS with Anon Token (should see 0 records)...');
  try {
    const { data, error } = await supabase.from('contracts').select('id');
    if (error) {
      console.error('❌ RLS Error:', error.message);
    } else {
      console.log(`✅ Anon saw ${data.length} records. (Expected: 0 if RLS is active)`);
    }
  } catch (err) {
    console.error('❌ Verify failed:', err.message);
  }
}

verifyAnon();
