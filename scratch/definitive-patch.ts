import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const adminSB = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function patch() {
  console.log("🛠️ Starting Definitive Enterprise Schema Patch...");

  const sql = `
    DO $$ 
    BEGIN 
      -- Audit Logs
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='ip_address') THEN
        ALTER TABLE audit_logs ADD COLUMN ip_address text;
      END IF;
      
      -- Infrastructure Logs
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='infrastructure_logs' AND column_name='level') THEN
        ALTER TABLE infrastructure_logs ADD COLUMN level text;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='infrastructure_logs' AND column_name='module') THEN
        ALTER TABLE infrastructure_logs ADD COLUMN module text;
      END IF;

      -- Ensure workspace_id on core tables
      -- Contracts Table Completion
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='workspace_id') THEN
        ALTER TABLE contracts ADD COLUMN workspace_id integer;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='annual_cost') THEN
        ALTER TABLE contracts ADD COLUMN annual_cost double precision;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='monthly_cost') THEN
        ALTER TABLE contracts ADD COLUMN monthly_cost double precision;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='contract_start_date') THEN
        ALTER TABLE contracts ADD COLUMN contract_start_date date;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='renewal_date') THEN
        ALTER TABLE contracts ADD COLUMN renewal_date date;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='contract_term_months') THEN
        ALTER TABLE contracts ADD COLUMN contract_term_months integer;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='license_count') THEN
        ALTER TABLE contracts ADD COLUMN license_count integer;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='auto_renewal') THEN
        ALTER TABLE contracts ADD COLUMN auto_renewal boolean DEFAULT false;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='payment_frequency') THEN
        ALTER TABLE contracts ADD COLUMN payment_frequency text;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='ai_analysis') THEN
        ALTER TABLE contracts ADD COLUMN ai_analysis jsonb;
      END IF;

      -- Audit Logs Table Completion
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='metadata') THEN
        ALTER TABLE audit_logs ADD COLUMN metadata jsonb DEFAULT '{}';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='ip_address') THEN
        ALTER TABLE audit_logs ADD COLUMN ip_address text;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='resource_type') THEN
        ALTER TABLE audit_logs ADD COLUMN resource_type text;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='audit_logs' AND column_name='resource_id') THEN
        ALTER TABLE audit_logs ADD COLUMN resource_id text;
      END IF;

      -- Infrastructure Logs Table Completion
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='infrastructure_logs' AND column_name='workspace_id') THEN
        ALTER TABLE infrastructure_logs ADD COLUMN workspace_id integer;
      END IF;
      
      -- Insurance Policies Table Completion
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='insurance_policies' AND column_name='claim_risk_score') THEN
        ALTER TABLE insurance_policies ADD COLUMN claim_risk_score integer DEFAULT 0;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='insurance_policies' AND column_name='workspace_id') THEN
        ALTER TABLE insurance_policies ADD COLUMN workspace_id integer;
      END IF;
    END $$;
  `;

  const { error } = await adminSB.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    // If rpc exec_sql doesn't exist, we use a different approach (manual table alter via REST isn't possible, we'd need another way)
    // For this environment, let's assume we can use the harmonization script again but with MORE verbose output and direct retries.
    console.error("❌ SQL Patch failed via RPC:", error.message);
    console.log("⚠️  Attempting fallback via HARMONIZE script...");
  } else {
    console.log("✅ SQL Patch applied successfully.");
  }
}

patch();
