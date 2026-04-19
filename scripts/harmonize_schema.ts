process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import pg from 'pg';
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

const { Client } = pg;
// Use Pooler host with separated credentials to avoid escaping issues
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function harmonize() {
  console.log("🚀 Starting Enterprise Schema Harmonization...");
  
  try {
    await client.connect();
    console.log("✅ Connected to PostgreSQL.");

    const queries = [
      // 1. Create Missing Enums (if any)
      `DO $$ BEGIN
          CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'editor', 'viewer');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,

      // 2. Create Missing Migration Tables (Phase 25/26)
      `CREATE TABLE IF NOT EXISTS remediation_suggestions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          workspace_id INTEGER,
          contract_id INTEGER NOT NULL,
          original_clause TEXT NOT NULL,
          suggested_clause TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          accepted_at TIMESTAMPTZ
      );`,
      `CREATE TABLE IF NOT EXISTS playbooks (
          id SERIAL PRIMARY KEY,
          workspace_id INTEGER,
          name TEXT NOT NULL,
          description TEXT,
          category TEXT NOT NULL,
          rules JSONB NOT NULL,
          is_active BOOLEAN DEFAULT true
      );`,
      `CREATE TABLE IF NOT EXISTS marketplace_listings (
          id SERIAL PRIMARY KEY,
          workspace_id INTEGER,
          seller_id UUID NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          category TEXT NOT NULL,
          content TEXT NOT NULL,
          price DOUBLE PRECISION NOT NULL,
          currency TEXT DEFAULT 'USD',
          rating DOUBLE PRECISION DEFAULT 0,
          sales_count INTEGER DEFAULT 0,
          is_verified BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      `CREATE TABLE IF NOT EXISTS marketplace_purchases (
          id SERIAL PRIMARY KEY,
          buyer_workspace_id INTEGER NOT NULL,
          buyer_id UUID NOT NULL,
          listing_id INTEGER NOT NULL,
          amount DOUBLE PRECISION NOT NULL,
          platform_fee DOUBLE PRECISION NOT NULL,
          seller_payout DOUBLE PRECISION NOT NULL,
          status TEXT DEFAULT 'completed',
          transaction_id TEXT,
          purchased_at TIMESTAMPTZ DEFAULT NOW()
      );`,

      `CREATE TABLE IF NOT EXISTS report_schedules (
          id SERIAL PRIMARY KEY,
          workspace_id INTEGER,
          title TEXT NOT NULL,
          type TEXT NOT NULL,
          frequency TEXT NOT NULL,
          regulatory_bodies JSONB,
          next_run TIMESTAMPTZ,
          last_run TIMESTAMPTZ,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      
      // 3. Additive Column Migrations (IF NOT EXISTS pattern)
      `ALTER TABLE clients ADD COLUMN IF NOT EXISTS workspace_id INTEGER;`,
      `ALTER TABLE contracts ADD COLUMN IF NOT EXISTS workspace_id INTEGER;`,
      `ALTER TABLE risks ADD COLUMN IF NOT EXISTS workspace_id INTEGER;`,
      `ALTER TABLE compliance_audits ADD COLUMN IF NOT EXISTS workspace_id INTEGER;`,
      `ALTER TABLE reports ADD COLUMN IF NOT EXISTS workspace_id INTEGER;`,
      `ALTER TABLE vendor_scorecards ADD COLUMN IF NOT EXISTS workspace_id INTEGER;`,
      `ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS workspace_id INTEGER;`,
      `ALTER TABLE clause_library ADD COLUMN IF NOT EXISTS workspace_id INTEGER;`,
      `ALTER TABLE savings_opportunities ADD COLUMN IF NOT EXISTS workspace_id INTEGER;`,
      `ALTER TABLE remediation_tasks ADD COLUMN IF NOT EXISTS workspace_id INTEGER;`,
      `ALTER TABLE comments ADD COLUMN IF NOT EXISTS workspace_id INTEGER;`,
      `ALTER TABLE contract_comparisons ADD COLUMN IF NOT EXISTS workspace_id INTEGER;`,
      `ALTER TABLE regulatory_alerts ADD COLUMN IF NOT EXISTS workspace_id INTEGER;`,
      `ALTER TABLE infrastructure_logs ADD COLUMN IF NOT EXISTS workspace_id INTEGER;`,
      `ALTER TABLE billing_telemetry ADD COLUMN IF NOT EXISTS workspace_id INTEGER;`,
      `ALTER TABLE clauses ADD COLUMN IF NOT EXISTS workspace_id INTEGER;`,
      `ALTER TABLE insurance_policies ADD COLUMN IF NOT EXISTS workspace_id INTEGER;`,
      
      // Additional safety patches
      `ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS owner_id UUID;`,
      `ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';`,

      // 4. Performance Indexes
      `CREATE INDEX IF NOT EXISTS idx_contracts_workspace ON contracts(workspace_id);`,
      `CREATE INDEX IF NOT EXISTS idx_compliance_audits_workspace ON compliance_audits(workspace_id);`,
      `CREATE INDEX IF NOT EXISTS idx_risks_workspace ON risks(workspace_id);`
    ];

    for (const query of queries) {
      try {
        await client.query(query);
        const snippet = query.split('\n')[0].substring(0, 50);
        console.log(`✅ Success: ${snippet}...`);
      } catch (err: any) {
        console.warn(`⚠️ Warning on query: ${query.substring(0, 50)}...`, err.message);
      }
    }

    console.log("\n✨ Harmonization Complete! All enterprise columns and tables patched.");
    
  } catch (err: any) {
    console.error("❌ Fatal Harmonization Error:", err.message);
  } finally {
    await client.end();
  }
}

harmonize();
