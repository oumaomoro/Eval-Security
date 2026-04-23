import { adminClient } from "../server/services/supabase.js";

async function verifySchemaSync() {
  console.log("🔍 [DIAGNOSTIC] Verifying Enterprise Infrastructure...");

  const tables = ["presence", "ai_cache", "infrastructure_logs"];
  
  for (const table of tables) {
    const { data, error } = await adminClient.from(table).select("*").limit(1);
    if (error) {
      console.error(`❌ Table '${table}' check failed: ${error.message}`);
    } else {
      console.log(`✅ Table '${table}' is operational.`);
    }
  }

  // Check workspaces.owner_id
  const { data: workspace, error: wsError } = await adminClient.from("workspaces").select("owner_id").limit(1);
  if (wsError) {
     console.error(`❌ 'workspaces.owner_id' check failed: ${wsError.message}`);
  } else {
     console.log("✅ 'workspaces.owner_id' column verified.");
  }

  console.log("✨ Verification Complete.");
}

verifySchemaSync().catch(console.error);
