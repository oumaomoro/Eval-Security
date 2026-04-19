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

async function introspectProfiles() {
  console.log("🔍 Live Introspection of 'profiles'...");
  
  try {
    // 1. Fetch any record to see keys
    const { data: rowData, error: rowError } = await supabase.from('profiles').select('*').limit(1);
    if (!rowError && rowData?.length) {
      console.log("✅ Row Introspection Success! Columns found:", Object.keys(rowData[0]));
    } else {
      console.warn("⚠️  Table empty or error on Fetch *:", rowError?.message);
    }
    
    // 2. Brute force specific known name types to see which one PostgREST resolves
    const testColumns = ['firstName', 'first_name', 'email', 'id'];
    for (const col of testColumns) {
      const { error } = await supabase.from('profiles').select(col).limit(1);
      if (!error) {
        console.log(`✅ Column '${col}' EXISTS in schema cache.`);
      } else {
        console.warn(`❌ Column '${col}' NOT FOUND in schema cache: ${error.message}`);
      }
    }

  } catch (err: any) {
    console.error("❌ Introspection script failed:", err.message);
  }
}

introspectProfiles();
