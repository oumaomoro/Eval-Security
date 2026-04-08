const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function finalVerify() {
  console.log("🔍 Final Sovereign Verification...");
  
  const tables = ['billing_telemetry', 'infrastructure_logs', 'workspace_members', 'comments'];
  
  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.error(`❌ Table '${table}' still has issues:`, error.message);
    } else {
      console.log(`✅ Table '${table}' is active and reachable.`);
    }
  }

  const { error: wsError } = await supabase.from('workspaces').select('owner_id').limit(1);
  if (wsError) {
    console.error("❌ 'workspaces.owner_id' check failed:", wsError.message);
  } else {
    console.log("✅ 'workspaces.owner_id' column is active.");
  }
}

finalVerify();
