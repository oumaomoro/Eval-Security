import { createClient } from '@supabase/supabase-js';
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

async function checkRLS() {
  console.log("Checking RLS Policies for 'profiles'...");
  
  // High-level check: try a restrictive query that might trigger policy evaluation errors
  const { data, error } = await supabase.from('profiles').select('id').limit(1);
  
  if (error) {
    console.log("❌ RLS/Query Error:", error.message);
    if (error.message.includes('firstName')) {
      console.log("🎯 BINGO: The error specifically mentions 'firstName' even in an 'id' only query.");
      console.log("This means a POLICY or TRIGGER is referencing the missing column.");
    }
  } else {
    console.log("✅ Query succeeded. (This shouldn't happen if policies are broken and we are hitting them).");
  }
}

checkRLS();
