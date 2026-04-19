import { adminClient } from "../server/services/supabase.js";

async function listTables() {
  console.log("🔍 Inspecting Database Schema...");
  try {
    // Check for existence of common tables using a raw RPC or a known table
    const { data, error } = await adminClient.from("contracts").select("id").limit(1);
    
    if (error) {
      console.warn("⚠️ 'contracts' table lookup failed:", error.message);
    } else {
      console.log("✅ 'contracts' table found.");
    }

    // Try finding information_schema (if possible via RPC) or just probing others
    const probe = async (table: string) => {
        const { error } = await adminClient.from(table).select("*").limit(0);
        console.log(`${error ? "❌" : "✅"} Table: ${table} ${error ? `(${error.message})` : ""}`);
    };

    await probe("users");
    await probe("workspaces");
    await probe("insurance_policies");
    await probe("usage_events");
    await probe("audit_logs");
    
  } catch (err: any) {
    console.error("❌ Schema inspection failed:", err.message);
  }
}

listTables();
