-- Phase 28 Enterprise Hardening: Performance Benchmarking & Automated Scheduling
-- Safe, idempotent execution for live Supabase cluster

-- 1. Create `report_schedules` if it doesn't exist
CREATE TABLE IF NOT EXISTS report_schedules (
  id SERIAL PRIMARY KEY,
  workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  frequency TEXT NOT NULL,
  regulatory_bodies JSONB,
  next_run TIMESTAMP WITH TIME ZONE,
  last_run TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enterprise RLS For Report Schedules
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'report_schedules' AND policyname = 'report_schedules_workspace_isolation'
  ) THEN
    CREATE POLICY report_schedules_workspace_isolation ON report_schedules
    FOR ALL
    USING (workspace_id = current_setting('app.current_workspace_id', TRUE)::int);
  END IF;
END $$;

-- 3. High-Performance B-Tree Indexes for massive entity sets

-- Contracts Table Indexes
CREATE INDEX IF NOT EXISTS idx_contracts_workspace_id ON contracts USING btree (workspace_id);

-- Insurance Policies Internal Indexes
CREATE INDEX IF NOT EXISTS idx_insurance_policies_workspace_id ON insurance_policies USING btree (workspace_id);

-- Risks Engine Indexes
CREATE INDEX IF NOT EXISTS idx_risks_workspace_id ON risks USING btree (workspace_id);
CREATE INDEX IF NOT EXISTS idx_risks_contract_id ON risks USING btree (contract_id);

-- Audit Logs Forensics Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace_id ON audit_logs USING btree (workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs USING btree (user_id);

-- Cost/Telemetry Indexes
CREATE INDEX IF NOT EXISTS idx_billing_telemetry_workspace_id ON billing_telemetry USING btree (workspace_id);

-- Report Schedules Lookup Index
CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run ON report_schedules USING btree (next_run) WHERE is_active = true;

-- Telemetry Confirmation
COMMENT ON TABLE report_schedules IS 'Enterprise automated compliance configuration pipelines.';
