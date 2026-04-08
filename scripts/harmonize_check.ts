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

async function checkCols() {
  const cols = ['id', 'email', 'first_name', 'firstName', 'last_name', 'lastName', 'role', 'client_id', 'clientId'];
  for (const col of cols) {
    const { error } = await supabase.from('profiles').select(col).limit(1);
    if (!error) {
      console.log(`PASS: [${col}] is present`);
    } else {
      console.log(`FAIL: [${col}] - ${error.message}`);
    }
  }
}

checkCols();
