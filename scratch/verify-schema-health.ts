import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verify() {
  console.log("🔍 Verifying Audit Logs Schema...");
  
  // Check column existence by querying it
  const { error: colError } = await supabase
    .from("audit_logs")
    .select("ip_address")
    .limit(1);

  if (colError) {
    console.error("❌ Column 'ip_address' missing or inaccessible:", colError.message);
  } else {
    console.log("✅ Column 'ip_address' exists in 'audit_logs'.");
  }

  console.log("\n🔍 Verifying Infrastructure Logs RLS...");
  const { error: insError } = await supabase
    .from("infrastructure_logs")
    .insert({
      level: "info",
      message: "E2E Schema Health Check",
      module: "SYSTEM"
    });

  if (insError) {
    console.error("❌ Infrastructure Logs insert failed:", insError.message);
  } else {
    console.log("✅ Infrastructure Logs insert succeeded (Service Role bypass verified).");
  }
}

verify();
