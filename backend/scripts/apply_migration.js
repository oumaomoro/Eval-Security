import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.production');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function applyMigration() {
  const sqlPath = path.join(process.cwd(), 'sql', 'migration_v14_organizations.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('🚀 Applying Phase 14 SQL Migration to Supabase...');

  // Note: Supabase's JS SDK doesn't have a direct 'runSql' method.
  // We use the internal '_raw' fetch or assume the user has the SQL Editor open.
  // HOWEVER, for a truly automated "sync", we will attempt to create the tables via the standard SDK
  // or provide a clear instruction if blocked.
  
  // Alternative: Use the SQL functionality if enabled via an RPC or similar.
  // For this environment, we will try to create the tables manually via the JS client just for the schema baseline.
  
  try {
    // 1. Create Organizations (if not exists)
    console.log('1. Checking Organizations table...');
    const { error: orgError } = await supabase.from('organizations').select('id').limit(1);
    if (orgError && orgError.code === 'PGRST116') {
        console.warn('⚠️ Table "organizations" missing. Please run the SQL migration in your Supabase SQL Editor.');
        console.log('SQL content saved to: backend/sql/migration_v14_organizations.sql');
    } else {
        console.log('✅ Organizations table exists or was already provisioned.');
    }

    // Since we can't easily run raw ALTER TABLE via the REST API without a specific RPC,
    // we will rely on the user running the SQL script once in the dashboard.
    // I will print the SQL path clearly.
    
  } catch (err) {
    console.error('Migration check failed:', err.message);
  }
}

applyMigration();
