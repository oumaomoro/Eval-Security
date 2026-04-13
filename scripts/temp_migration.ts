import { adminClient } from '../server/services/supabase.js';


async function runMigration() {
  console.log('🚀 Attempting Autonomic Schema Migration (api_key)...');
  
  const sql = `
    ALTER TABLE profiles 
    ADD COLUMN IF NOT EXISTS api_key TEXT;
  `;

  // We try to use a common 'exec_sql' RPC if available in the Supabase project
  const { data, error } = await adminClient.rpc('exec_sql', { sql_string: sql });

  if (error) {
    if (error.message.includes('function "exec_sql" does not exist')) {
       console.error('\n❌ ERROR: The "exec_sql" RPC is not available in this Supabase project.');
       console.error('Please manually run the following SQL in the Supabase Dashboard (https://supabase.com/dashboard/project/ulercnwyckrcjcnrenzz/sql/new):');
       console.log('--------------------------------------------------');
       console.log(sql.trim());
       console.log('--------------------------------------------------');
       process.exit(1);
    }
    console.error('\n❌ MIGRATION FAILED:', error.message);
    process.exit(1);
  }

  console.log('✅ Migration successful: profiles.api_key column added.');
  process.exit(0);
}

runMigration();
