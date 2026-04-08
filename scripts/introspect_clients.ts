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

async function introspectClients() {
  console.log("Introspecting 'clients' table columns...");
  const { data, error } = await supabase.from('clients').select('*').limit(1);
  if (error) {
    console.log("❌ Error fetching clients:", error.message);
  } else if (data && data.length > 0) {
    console.log("✅ Columns found in 'clients':", Object.keys(data[0]));
  } else {
    console.log("⚠️ Table 'clients' is empty. Testing via explicit select...");
    const { error: err2 } = await supabase.from('clients').select('company_name').limit(1);
    if (!err2) console.log("✅ 'company_name' exists (snake_case).");
    const { error: err3 } = await supabase.from('clients').select('companyName').limit(1);
    if (err3) console.log("❌ 'companyName' does NOT exist (camelCase).");
  }
}

introspectClients();
