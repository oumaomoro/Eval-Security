import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function forceSync() {
  console.log("🚀 Forced Infrastructure Sync Initiated...");
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log("🔗 Connected to Sovereign Database.");

    const sql = `
      -- 1. Create Tables
      CREATE TABLE IF NOT EXISTS cloud_accounts (
        id SERIAL PRIMARY KEY,
        workspace_id INTEGER NOT NULL,
        provider TEXT NOT NULL,
        account_name TEXT NOT NULL,
        account_id TEXT NOT NULL,
        region TEXT,
        status TEXT DEFAULT 'active',
        last_sync_at TIMESTAMP WITH TIME ZONE,
        compliance_score INTEGER DEFAULT 100,
        iam_policy_count INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS infrastructure_assets (
        id SERIAL PRIMARY KEY,
        workspace_id INTEGER NOT NULL,
        cloud_account_id INTEGER,
        name TEXT NOT NULL,
        asset_type TEXT NOT NULL,
        resource_id TEXT,
        severity TEXT DEFAULT 'none',
        exposure_type TEXT DEFAULT 'private',
        tags JSONB,
        last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        vulnerability_count INTEGER DEFAULT 0,
        misconfiguration_flags JSONB
      );

      -- 2. Ensure Workspace constraints (simplified for speed)
      -- Assuming workspaces table exists
    `;

    await client.query(sql);
    console.log("✅ SQL Schema Injected Successfully.");

  } catch (err: any) {
    console.error("❌ Force Sync Failed:", err.message);
  } finally {
    await client.end();
  }
}

forceSync();
