import { supabase } from '../cyberoptimize-prod/backend/services/supabase.service.js';

async function checkSchema() {
  console.log('[SchemaAudit] Attempting to fetch a single profile to verify columns...');
  const { data, error } = await supabase.from('profiles').select('*').limit(1);

  if (error) {
    console.error('[SchemaAudit] Profile fetch failed:', error.message);
  } else if (data && data.length > 0) {
    console.log('[SchemaAudit] Profile Columns detected:', Object.keys(data[0]));
  } else {
    console.log('[SchemaAudit] No profiles found to inspect.');
  }

  console.log('[SchemaAudit] Verifying if table "organizations" exists...');
  const { error: orgError } = await supabase.from('organizations').select('id').limit(1);
  console.log('[SchemaAudit] Organizations table exists:', !orgError);

  console.log('[SchemaAudit] Verifying if table "workspaces" exists...');
  const { error: wsError } = await supabase.from('workspaces').select('id').limit(1);
  console.log('[SchemaAudit] Workspaces table exists:', !wsError);
}

checkSchema();
