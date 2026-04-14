import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: 'cyberoptimize-prod/backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('🚀 Running Deep Infrastructure Audit (System Catalogs)...');
  try {
    // Audit check constraints via information_schema
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: "SELECT check_clause FROM information_schema.check_constraints WHERE constraint_name = 'profiles_role_check';" 
    });
    
    if (error) {
      console.error('❌ RPC Error:', error.message);
    } else {
      console.log('✅ Constraint Clause:', JSON.stringify(data, null, 2));
    }

    // Secondary Audit: List all valid enum values for roles if they exist
    const { data: colData } = await supabase.rpc('exec_sql', {
      sql_query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles';"
    });
    console.log('✅ Profiles Columns:', JSON.stringify(colData, null, 2));

  } catch (err) {
    console.error('❌ Critical failure:', err.message);
  }
}

run();
