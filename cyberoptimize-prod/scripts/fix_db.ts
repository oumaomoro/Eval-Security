import pg from 'pg';
const { Client } = pg;
import 'dotenv/config';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function fix() {
  const client = new Client({
    connectionString: `postgres://postgres:CyberOptimizeDb2026!@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log(`Attempting to connect to database...`);
    await client.connect();
    console.log("Connected to database.");

    console.log("Adding missing columns to 'clients'...");
    await client.query(`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS risk_threshold integer DEFAULT 70,
      ADD COLUMN IF NOT EXISTS compliance_focus text DEFAULT 'KDPA';
    `);

    console.log("Adding missing columns to 'profiles'...");
    await client.query(`
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS subscription_tier varchar DEFAULT 'starter',
      ADD COLUMN IF NOT EXISTS contracts_count integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS mfa_enabled boolean DEFAULT false;
    `);

    console.log("Adding missing Phase 25 tables...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS billing_telemetry (
        id serial PRIMARY KEY,
        client_id integer NOT NULL,
        metric_type text NOT NULL,
        value double precision NOT NULL,
        cost double precision,
        timestamp timestamp DEFAULT current_timestamp
      );

      CREATE TABLE IF NOT EXISTS infrastructure_logs (
        id serial PRIMARY KEY,
        component text NOT NULL,
        event text NOT NULL,
        status text NOT NULL DEFAULT 'detected',
        action_taken text,
        timestamp timestamp DEFAULT current_timestamp
      );

      ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS owner_id text;

      CREATE TABLE IF NOT EXISTS workspace_members (
        id serial PRIMARY KEY,
        user_id text NOT NULL,
        workspace_id integer NOT NULL,
        role text NOT NULL DEFAULT 'viewer',
        created_at timestamp DEFAULT current_timestamp
      );

      CREATE TABLE IF NOT EXISTS comments (
        id serial PRIMARY KEY,
        user_id text NOT NULL,
        contract_id integer,
        audit_id integer,
        content text NOT NULL,
        resolved boolean DEFAULT false,
        created_at timestamp DEFAULT current_timestamp
      );
    `);

    console.log("Schema fix complete.");
  } catch (err: any) {
    console.error("Error fixing schema:", err.message || err);
  } finally {
    await client.end();
  }
}

fix();
