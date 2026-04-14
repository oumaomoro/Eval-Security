import pkg from 'pg';
const { Client } = pkg;
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

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL missing");
  process.exit(1);
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function fixSchema() {
  const projectId = "ulercnwyckrcjcnrenzz";
  const dbHost = `db.${projectId}.supabase.co`;
  
  console.log(`🔧 Using Direct Database Host: ${dbHost}`);

  const client = new Client({
    host: dbHost,
    port: 5432,
    user: 'postgres',
    password: 'CyberOptimizeDb2026!',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("🚀 Connected to database. Hardening schema...");

    // Add missing columns to clients
    await client.query(`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS compliance_focus TEXT DEFAULT 'KDPA',
      ADD COLUMN IF NOT EXISTS risk_threshold INTEGER DEFAULT 70;
    `);
    console.log("✅ 'clients' table hardened.");

    // Add missing columns to profiles
    await client.query(`
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'starter',
      ADD COLUMN IF NOT EXISTS contracts_count INTEGER DEFAULT 0;
    `);
    console.log("✅ 'profiles' table hardened.");

    // Ensure comments table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        user_id TEXT REFERENCES profiles(id) NOT NULL,
        contract_id INTEGER REFERENCES contracts(id),
        audit_id INTEGER REFERENCES compliance_audits(id),
        content TEXT NOT NULL,
        resolved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ 'comments' table verified.");

  } catch (err) {
    console.error("❌ Schema fix failed:", err.message);
  } finally {
    await client.end();
  }
}

fixSchema();
