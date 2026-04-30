-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: 0006_contract_intelligence.sql
-- Phase 35: Contract Intelligence & Usage Governance
--
-- Creates:
--   1. contract_versions   — version-controlled history for uploaded contracts
--   2. usage_events        — per-workspace AI credit consumption ledger
-- Patches:
--   3. report_schedules    — adds missing `recipient_email` column
--   4. remediation_suggestions — adds workspace_id + rule_id foreign keys
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. CONTRACT VERSIONS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contract_versions (
  id               BIGSERIAL PRIMARY KEY,
  contract_id      BIGINT NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  version_number   INTEGER NOT NULL DEFAULT 1,
  file_url         TEXT NOT NULL,
  changes_summary  TEXT,
  created_by       TEXT,                           -- user ID or 'SYSTEM'
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (contract_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_contract_versions_contract
  ON public.contract_versions (contract_id, version_number DESC);

ALTER TABLE public.contract_versions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'contract_versions' AND policyname = 'service_role_all_contract_versions'
  ) THEN
    CREATE POLICY "service_role_all_contract_versions"
      ON public.contract_versions FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'contract_versions' AND policyname = 'users_own_workspace_contract_versions'
  ) THEN
    CREATE POLICY "users_own_workspace_contract_versions"
      ON public.contract_versions FOR ALL
      USING (
        contract_id IN (
          SELECT c.id FROM public.contracts c
          JOIN public.workspace_members wm ON wm.workspace_id = c.workspace_id
          WHERE wm.user_id = auth.uid()::text
        )
      );
  END IF;
END $$;

-- ── 2. USAGE EVENTS ───────────────────────────────────────────────────────────
-- Tracks per-workspace AI credit consumption for billing governance.
CREATE TABLE IF NOT EXISTS public.usage_events (
  id            BIGSERIAL PRIMARY KEY,
  workspace_id  BIGINT NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_type    TEXT NOT NULL,                     -- e.g. 'insurance_analysis', 'clause_generation'
  credits_used  INTEGER NOT NULL DEFAULT 1,
  metadata      JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_usage_events_workspace
  ON public.usage_events (workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_events_type
  ON public.usage_events (event_type, created_at DESC);

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'usage_events' AND policyname = 'service_role_all_usage_events'
  ) THEN
    CREATE POLICY "service_role_all_usage_events"
      ON public.usage_events FOR ALL
      USING (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'usage_events' AND policyname = 'users_own_workspace_usage_events'
  ) THEN
    CREATE POLICY "users_own_workspace_usage_events"
      ON public.usage_events FOR SELECT
      USING (
        workspace_id IN (
          SELECT workspace_id FROM public.workspace_members
          WHERE user_id = auth.uid()::text
        )
      );
  END IF;
END $$;

-- ── 3. PATCH: report_schedules ── add missing recipient_email column ──────────
ALTER TABLE public.report_schedules
  ADD COLUMN IF NOT EXISTS recipient_email TEXT;

COMMENT ON COLUMN public.report_schedules.recipient_email
  IS 'Email address to dispatch the generated report to on schedule execution.';

-- ── 4. PATCH: remediation_suggestions ── add workspace_id + rule_id ──────────
ALTER TABLE public.remediation_suggestions
  ADD COLUMN IF NOT EXISTS workspace_id BIGINT REFERENCES public.workspaces(id) ON DELETE CASCADE;

ALTER TABLE public.remediation_suggestions
  ADD COLUMN IF NOT EXISTS rule_id BIGINT REFERENCES public.playbook_rules(id) ON DELETE SET NULL;

ALTER TABLE public.remediation_suggestions
  ADD COLUMN IF NOT EXISTS user_id TEXT;              -- user who accepted/rejected

ALTER TABLE public.remediation_suggestions
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

-- Back-fill workspace_id from parent contract (safe, idempotent)
UPDATE public.remediation_suggestions rs
SET workspace_id = c.workspace_id
FROM public.contracts c
WHERE rs.contract_id = c.id
  AND rs.workspace_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_remediation_suggestions_workspace
  ON public.remediation_suggestions (workspace_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_remediation_suggestions_rule
  ON public.remediation_suggestions (rule_id)
  WHERE rule_id IS NOT NULL;

-- ── 5. Workspace API Usage Counter ───────────────────────────────────────────
-- Lightweight column for fast subscription enforcement checks.
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS api_usage_count INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.workspaces.api_usage_count
  IS 'Cumulative API call counter used for rate-limiting and tier enforcement.';

-- ── 6. Force PostgREST schema cache reload ────────────────────────────────────
NOTIFY pgrst, 'reload schema';

COMMENT ON TABLE public.contract_versions IS 'Immutable version history for uploaded contract documents.';
COMMENT ON TABLE public.usage_events IS 'Per-workspace AI credit consumption ledger for billing governance.';
