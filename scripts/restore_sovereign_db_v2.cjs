const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function restoreSovereign() {
  console.log("🚀 Restoring Sovereign Mode: Synchronizing Database (Step-by-Step)...");

  // Step 1: Create tables without foreign keys
  const createTablesSql = `
    ALTER TABLE IF EXISTS public.workspaces ADD COLUMN IF NOT EXISTS owner_id text;

    CREATE TABLE IF NOT EXISTS public.billing_telemetry (
      id SERIAL PRIMARY KEY,
      client_id INTEGER,
      metric_type TEXT NOT NULL,
      value INTEGER NOT NULL,
      cost DECIMAL(10,2) DEFAULT 0,
      timestamp TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.infrastructure_logs (
      id SERIAL PRIMARY KEY,
      timestamp TIMESTAMPTZ DEFAULT NOW(),
      component TEXT NOT NULL,
      event TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      action_taken TEXT
    );

    CREATE TABLE IF NOT EXISTS public.workspace_members (
      id SERIAL PRIMARY KEY,
      workspace_id INTEGER,
      user_id TEXT,
      role TEXT NOT NULL DEFAULT 'viewer',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.comments (
      id SERIAL PRIMARY KEY,
      contract_id INTEGER,
      audit_id INTEGER,
      user_id TEXT,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // Step 2: Add foreign keys (Cautiously)
  const addConstraintsSql = `
    -- Attempting to add constraints one by one
    DO $$ 
    BEGIN
      -- workspaces FK
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        ALTER TABLE public.workspaces DROP CONSTRAINT IF EXISTS workspaces_owner_id_fkey;
        ALTER TABLE public.workspaces ADD CONSTRAINT workspaces_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id);
      END IF;

      -- billing_telemetry FK
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
         ALTER TABLE public.billing_telemetry DROP CONSTRAINT IF EXISTS billing_telemetry_client_id_fkey;
         ALTER TABLE public.billing_telemetry ADD CONSTRAINT billing_telemetry_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);
      END IF;

      -- workspace_members FKs
      ALTER TABLE public.workspace_members DROP CONSTRAINT IF EXISTS workspace_members_workspace_id_fkey;
      ALTER TABLE public.workspace_members ADD CONSTRAINT workspace_members_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id);
      
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        ALTER TABLE public.workspace_members DROP CONSTRAINT IF EXISTS workspace_members_user_id_fkey;
        ALTER TABLE public.workspace_members ADD CONSTRAINT workspace_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);
      END IF;

      -- comments FKs
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contracts') THEN
        ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_contract_id_fkey;
        ALTER TABLE public.comments ADD CONSTRAINT comments_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.contracts(id);
      END IF;
      
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;
        ALTER TABLE public.comments ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Some constraints could not be added: %', SQLERRM;
    END $$;
  `;

  try {
    console.log("📡 Creating tables...");
    await supabase.rpc('exec_sql', { sql_query: createTablesSql });
    
    console.log("📡 Applying constraints...");
    await supabase.rpc('exec_sql', { sql_query: addConstraintsSql });

    console.log("✅ Sovereign Mode Restored (Hybrid Constraint Application).");
    process.exit(0);
  } catch (err) {
    console.error("❌ Sovereign Restoration FAILED:", err.message);
    process.exit(1);
  }
}

restoreSovereign();
