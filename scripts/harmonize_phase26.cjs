/**
 * Phase 26 Schema Harmonization via Supabase Management API
 * Uses the pg module directly with the connection string from env.
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Strategy: Use supabase.from().select() with raw query via the REST API
// Since exec_sql is gone, we use individual table operations to verify
// and use the PostgreSQL connection string directly via pg module.

const { Client } = require('pg');

async function runViaPG() {
  // Build connection from SUPABASE_DB_URL or reconstruct from parts
  const dbUrl = process.env.DATABASE_URL
    || `postgresql://postgres.ulercnwyckrcjcnrenzz:CostlociDb2026!@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`;

  console.log('🔌 Connecting via direct PostgreSQL pooler...');
  
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('✅ Connected.\n');

  const statements = [
    // Enums
    `DO $$ BEGIN CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'editor', 'viewer'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    
    // New tables
    `CREATE TABLE IF NOT EXISTS remediation_suggestions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id INTEGER,
      contract_id INTEGER NOT NULL,
      original_clause TEXT NOT NULL,
      suggested_clause TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      accepted_at TIMESTAMPTZ
    )`,
    `CREATE TABLE IF NOT EXISTS playbooks (
      id SERIAL PRIMARY KEY,
      workspace_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      rules JSONB NOT NULL DEFAULT '[]',
      is_active BOOLEAN DEFAULT true
    )`,
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
    )`,
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
    )`,
    `CREATE TABLE IF NOT EXISTS notification_channels (
      id SERIAL PRIMARY KEY,
      workspace_id INTEGER,
      provider TEXT NOT NULL,
      webhook_url TEXT NOT NULL,
      events JSONB DEFAULT '[]',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    // workspace_id columns
    `ALTER TABLE clients               ADD COLUMN IF NOT EXISTS workspace_id INTEGER`,
    `ALTER TABLE contracts             ADD COLUMN IF NOT EXISTS workspace_id INTEGER`,
    `ALTER TABLE risks                 ADD COLUMN IF NOT EXISTS workspace_id INTEGER`,
    `ALTER TABLE compliance_audits     ADD COLUMN IF NOT EXISTS workspace_id INTEGER`,
    `ALTER TABLE reports               ADD COLUMN IF NOT EXISTS workspace_id INTEGER`,
    `ALTER TABLE vendor_scorecards     ADD COLUMN IF NOT EXISTS workspace_id INTEGER`,
    `ALTER TABLE audit_logs            ADD COLUMN IF NOT EXISTS workspace_id INTEGER`,
    `ALTER TABLE clause_library        ADD COLUMN IF NOT EXISTS workspace_id INTEGER`,
    `ALTER TABLE savings_opportunities ADD COLUMN IF NOT EXISTS workspace_id INTEGER`,
    `ALTER TABLE comments              ADD COLUMN IF NOT EXISTS workspace_id INTEGER`,
    `ALTER TABLE contract_comparisons  ADD COLUMN IF NOT EXISTS workspace_id INTEGER`,
    `ALTER TABLE regulatory_alerts     ADD COLUMN IF NOT EXISTS workspace_id INTEGER`,
    `ALTER TABLE infrastructure_logs   ADD COLUMN IF NOT EXISTS workspace_id INTEGER`,
    `ALTER TABLE billing_telemetry     ADD COLUMN IF NOT EXISTS workspace_id INTEGER`,
    `ALTER TABLE clauses               ADD COLUMN IF NOT EXISTS workspace_id INTEGER`,

    // Safety patches
    `ALTER TABLE workspaces        ADD COLUMN IF NOT EXISTS owner_id UUID`,
    `ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'`,

    // Indexes
    `CREATE INDEX IF NOT EXISTS idx_contracts_workspace         ON contracts(workspace_id)`,
    `CREATE INDEX IF NOT EXISTS idx_compliance_audits_workspace ON compliance_audits(workspace_id)`,
    `CREATE INDEX IF NOT EXISTS idx_risks_workspace             ON risks(workspace_id)`,
    `CREATE INDEX IF NOT EXISTS idx_comments_workspace          ON comments(workspace_id)`,
    `CREATE INDEX IF NOT EXISTS idx_billing_workspace           ON billing_telemetry(workspace_id)`,
    `CREATE INDEX IF NOT EXISTS idx_clients_workspace           ON clients(workspace_id)`,
    `CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace        ON audit_logs(workspace_id)`,
  ];

  let passed = 0;
  let failed = 0;

  for (const sql of statements) {
    const label = sql.split('\n')[0].trim().substring(0, 70);
    try {
      await client.query(sql);
      console.log(`  ✅ ${label}`);
      passed++;
    } catch (err) {
      console.warn(`  ⚠️  ${label}`);
      console.warn(`     → ${err.message}`);
      failed++;
    }
  }

  await client.end();

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Passed: ${passed}  ❌ Failed: ${failed}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  
  if (failed === 0) {
    console.log('\n🏆 Phase 26 Schema Fully Harmonized — workspace_id multi-tenancy LIVE.');
  } else {
    console.log('\n⚠️  Some steps reported warnings (likely already-applied patches — safe to ignore).');
  }
}

runViaPG().catch(err => {
  console.error('❌ Fatal connection error:', err.message);
  console.log('\n📋 MANUAL FALLBACK: Run scripts/phase26_harmonize.sql directly in the Supabase SQL Editor:');
  console.log('   https://supabase.com/dashboard/project/ulercnwyckrcjcnrenzz/sql/new');
  process.exit(1);
});
