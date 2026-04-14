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
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function introspectProfiles() {
  console.log("🔍 Introspecting 'profiles' table via REST...");
  
  try {
    // Attempt to get column names by hitting a non-existent column to see the error message's column list 
    // or by hitting the OpenAPI spec.
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    
    if (error) {
      console.log("❌ Select * failed:", error.message);
    } else {
      console.log("✅ Select * succeeded! Columns found:", data.length > 0 ? Object.keys(data[0]) : "Table empty, no columns to show.");
    }
    
    // Try to get schema info via RPC if available
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_table_info', { tname: 'profiles' });
    if (!rpcError) {
      console.log("📊 RPC Schema info:", rpcData);
    }

  } catch (err) {
    console.error("❌ Introspection failed:", err.message);
  }
}

introspectProfiles();
