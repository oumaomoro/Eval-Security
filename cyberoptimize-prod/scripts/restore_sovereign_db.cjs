const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function restoreSovereign() {
  console.log("🚀 Restoring Sovereign Mode: Synchronizing Database...");

  const ddl = `
    -- 1. Support for Workspaces owner
    ALTER TABLE IF EXISTS public.workspaces ADD COLUMN IF NOT EXISTS owner_id text;

    -- 2. Enterprise Billing Telemetry
    CREATE TABLE IF NOT EXISTS public.billing_telemetry (
      id SERIAL PRIMARY KEY,
      client_id INTEGER REFERENCES public.clients(id),
      metric_type TEXT NOT NULL,
      value INTEGER NOT NULL,
      cost DECIMAL(10,2) DEFAULT 0,
      timestamp TIMESTAMPTZ DEFAULT NOW()
    );

    -- 3. Autonomous Infrastructure Logs
    CREATE TABLE IF NOT EXISTS public.infrastructure_logs (
      id SERIAL PRIMARY KEY,
      timestamp TIMESTAMPTZ DEFAULT NOW(),
      component TEXT NOT NULL,
      event TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      action_taken TEXT
    );

    -- 4. Enterprise Team Management (Workspace Members)
    CREATE TABLE IF NOT EXISTS public.workspace_members (
      id SERIAL PRIMARY KEY,
      workspace_id INTEGER REFERENCES public.workspaces(id),
      user_id TEXT REFERENCES public.profiles(id),
      role TEXT NOT NULL DEFAULT 'viewer',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 5. Enhanced Collaboration Hub (Comments)
    CREATE TABLE IF NOT EXISTS public.comments (
      id SERIAL PRIMARY KEY,
      contract_id INTEGER REFERENCES public.contracts(id),
      audit_id INTEGER,
      user_id TEXT REFERENCES public.profiles(id),
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 6. Trigger schema cache reload
    NOTIFY pgrst, 'reload schema';
  `;

  try {
    console.log("📡 Sending Sovereign DDL via RPC Bridge...");
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: ddl });

    if (error) {
      console.error("❌ Sovereign Restoration FAILED:", error.message);
      process.exit(1);
    }

    console.log("✅ Sovereign Mode Restored. Native database is now synchronized.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Unexpected error during restoration:", err.message);
    process.exit(1);
  }
}

restoreSovereign();
