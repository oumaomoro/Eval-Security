import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

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

const { Client } = pg;
const connectionString = "postgres://postgres:CyberOptimizeDb2026!@ulercnwyckrcjcnrenzz.supabase.co:5432/postgres";

async function check() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    const res = await client.query('SELECT current_user, current_database(), version()');
    console.log("SUCCESS:", res.rows[0]);
  } catch (err: any) {
    console.error("FAILURE:", err.message);
    if (err.detail) console.error("DETAIL:", err.detail);
    if (err.hint) console.error("HINT:", err.hint);
  } finally {
    await client.end();
  }
}

check();
