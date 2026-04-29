import { adminClient as supabase } from "../server/services/supabase.js";

async function applySchema() {
  console.log("🚀 Applying Infrastructure SQL Schema...");

  const sql = `
    -- Cloud Accounts Table
    CREATE TABLE IF NOT EXISTS cloud_accounts (
      id SERIAL PRIMARY KEY,
      workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      provider TEXT NOT NULL CHECK (provider IN ('aws', 'azure', 'gcp', 'digitalocean', 'other')),
      account_name TEXT NOT NULL,
      account_id TEXT NOT NULL,
      region TEXT,
      status TEXT DEFAULT 'active',
      last_sync_at TIMESTAMP WITH TIME ZONE,
      compliance_score INTEGER DEFAULT 100,
      iam_policy_count INTEGER DEFAULT 0
    );

    -- Infrastructure Assets Table
    CREATE TABLE IF NOT EXISTS infrastructure_assets (
      id SERIAL PRIMARY KEY,
      workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      cloud_account_id INTEGER REFERENCES cloud_accounts(id),
      name TEXT NOT NULL,
      asset_type TEXT NOT NULL CHECK (asset_type IN ('compute', 'storage', 'database', 'network', 'firewall', 'other')),
      resource_id TEXT,
      severity TEXT DEFAULT 'none' CHECK (severity IN ('critical', 'high', 'medium', 'low', 'none')),
      exposure_type TEXT DEFAULT 'private' CHECK (exposure_type IN ('private', 'public', 'internal')),
      tags JSONB,
      last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      vulnerability_count INTEGER DEFAULT 0,
      misconfiguration_flags JSONB
    );

    -- Enable RLS on new tables
    ALTER TABLE cloud_accounts ENABLE ROW LEVEL SECURITY;
    ALTER TABLE infrastructure_assets ENABLE ROW LEVEL SECURITY;
  `;

  try {
    // Supabase JS client doesn't have a direct .query() for DDL
    // We use the RPC or a clever trick if possible, 
    // but the best way in this environment is often to just run it via the dashboard.
    // However, I can try to use a dummy RPC if it exists, or just tell the user.
    
    console.log("⚠️  Sovereign bypass: Please execute the following SQL in your Supabase SQL Editor to finalize Phase 25:");
    console.log(sql);
    
  } catch (err: any) {
    console.error("❌ SQL Apply failed:", err.message);
  }
}

applySchema();
