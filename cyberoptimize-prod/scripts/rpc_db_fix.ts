import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Manual .env loader
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

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function attemptRpcFix() {
  console.log("🚀 Attempting to fix DB schema via Supabase RPC...");
  
  const sql = "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text UNIQUE;";
  
  try {
    // Try common SQL execution RPC names
    const rpcs = ['exec_sql', 'run_sql', 'sql_query'];
    
    for (const rpcName of rpcs) {
      console.log(`Trying RPC: ${rpcName}...`);
      const { data, error } = await supabase.rpc(rpcName, { query: sql });
      
      if (!error) {
        console.log(`✅ Success! DB fixed via ${rpcName}.`);
        process.exit(0);
      } else {
        console.warn(`⚠️  RPC ${rpcName} failed or does not exist: ${error.message}`);
      }
    }
    
    console.error("\n❌ Could not find an RPC to execute SQL. Database fix required.");
    process.exit(1);

  } catch (err) {
    console.error("❌ RPC fix failed:", err.message);
    process.exit(1);
  }
}

attemptRpcFix();
