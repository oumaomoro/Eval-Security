import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Self-contained env loader
try {
  const envPath = resolve(process.cwd(), ".env");
  const envFile = readFileSync(envPath, "utf-8");
  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match && !process.env[match[1]]) {
      let val = match[2] || "";
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      process.env[match[1]] = val;
    }
  }
} catch (e) {}

async function discoverTableTypes() {
  const url = process.env.SUPABASE_URL || "https://ulercnwyckrcjcnrenzz.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  
  if (!key) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY missing from .env");
    return;
  }

  const supabase = createClient(url, key);
  console.log(`🔍 Introspecting Project Types: ${url}`);
  
  // Query information_schema to get real types
  // Note: We use an RPC or a standard query if permissions allow.
  // Since we are using service_role, we can try to query pg_attribute or information_schema via a trick 
  // or just look at the data if we can't do DDL queries via REST.
  
  const tables = ["profiles", "clients", "contracts", "compliance_audits"];
  
  for (const table of tables) {
    console.log(`--- Table: ${table} ---`);
    const { data, error } = await supabase.from(table).select("*").limit(1);
    
    if (error) {
      console.warn(`⚠️ Error or Table Missing: ${error.message}`);
      continue;
    }

    if (data && data.length > 0) {
      const firstRow = data[0];
      for (const [key, value] of Object.entries(firstRow)) {
        let typeInfo = typeof value;
        if (value === null) typeInfo = "null (type unknown)";
        console.log(`${key}: ${typeInfo} (Example: ${value})`);
      }
    } else {
      console.log("Table is empty, types cannot be inferred from data.");
    }
  }
}

discoverTableTypes();
