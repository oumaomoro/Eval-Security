import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const adminSB = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function inspect() {
  console.log("🔍 Inspecting 'contracts' table columns...");
  const { data, error } = await adminSB.rpc('exec_sql', {
    sql_query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'contracts';"
  });

  if (error) {
    console.error("❌ Failed to query information_schema:", error.message);
  } else {
    console.log("✅ Columns found:", data);
  }
  
  // Try a test insert
  console.log("\n🔍 Attempting test insert into 'contracts'...");
  const { data: insData, error: insError } = await adminSB.from("contracts").insert({
    vendor_name: "Diagnostic Test",
    product_service: "Health Check",
    category: "security",
    client_id: 1, // Assumes client 1 exists or use a dummy
    workspace_id: 1 // Assumes workspace 1 exists
  }).select();

  if (insError) {
    console.error("❌ Test insert failed:", insError.message);
  } else {
    console.log("✅ Test insert succeeded!");
  }
}

inspect();
