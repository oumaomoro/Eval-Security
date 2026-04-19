-- CyberOptimize Enterprise — Phase 26 Schema Harmonization
-- Multi-Tenancy (workspace_id), New Feature Tables, and Performance Indexes
-- INSTRUCTIONS: Paste this entire script into:
--   https://supabase.com/dashboard/project/ulercnwyckrcjcnrenzz/sql/new
-- Then click "Run".

BEGIN;

-- ═══════════════════════════════════════════════════════
-- 1. ENUMS
-- ═══════════════════════════════════════════════════════
DO $$ BEGIN
  CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'editor', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ═══════════════════════════════════════════════════════
-- 2. NEW TABLES (Phase 26 Features)
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS remediation_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id INTEGER,
  contract_id INTEGER NOT NULL,
  original_clause TEXT NOT NULL,
  suggested_clause TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS playbooks (
  id SERIAL PRIMARY KEY,
  workspace_id INTEGER,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  rules JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS marketplace_listings (
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
);

CREATE TABLE IF NOT EXISTS marketplace_purchases (
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
);

CREATE TABLE IF NOT EXISTS notification_channels (
  id SERIAL PRIMARY KEY,
  workspace_id INTEGER,
  provider TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  events JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════════
-- 3. ADD workspace_id TO ALL EXISTING TABLES
-- ═══════════════════════════════════════════════════════

ALTER TABLE clients               ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE contracts             ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE risks                 ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE compliance_audits     ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE reports               ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE vendor_scorecards     ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE audit_logs            ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE clause_library        ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE savings_opportunities ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE comments              ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE contract_comparisons  ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE regulatory_alerts     ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE infrastructure_logs   ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE billing_telemetry     ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE clauses               ADD COLUMN IF NOT EXISTS workspace_id INTEGER;


-- ═══════════════════════════════════════════════════════
-- 4. SAFETY PATCHES (idempotent)
-- ═══════════════════════════════════════════════════════

ALTER TABLE workspaces        ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';


-- ═══════════════════════════════════════════════════════
-- 5. PERFORMANCE INDEXES
-- ═══════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_contracts_workspace         ON contracts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_compliance_audits_workspace ON compliance_audits(workspace_id);
CREATE INDEX IF NOT EXISTS idx_risks_workspace             ON risks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_comments_workspace          ON comments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_billing_workspace           ON billing_telemetry(workspace_id);
CREATE INDEX IF NOT EXISTS idx_clients_workspace           ON clients(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace        ON audit_logs(workspace_id);

COMMIT;

-- ═══════════════════════════════════════════════════════
-- VERIFICATION QUERY (run separately after script above)
-- ═══════════════════════════════════════════════════════
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN (
--   'remediation_suggestions','playbooks','marketplace_listings',
--   'marketplace_purchases','notification_channels'
-- );
