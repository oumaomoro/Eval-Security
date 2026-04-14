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

async function check() {
  console.log("🔍 Checking 'clients' table structure via REST RPC (indirectly)...");
  
  // Try to select columns that might exist
  const { data, error } = await supabase.from('clients').select('*').limit(1);
  if (error) {
    console.error("❌ Error fetching clients:", error.message);
  } else {
    console.log("✅ Clients found. Keys:", Object.keys(data[0] || {}));
  }

  const { data: comments, error: commentError } = await supabase.from('comments').select('*').limit(1);
  if (commentError) {
    console.warn("⚠️ Comments table error:", commentError.message);
  } else {
    console.log("✅ Comments table EXISTS.");
  }
}

check();
