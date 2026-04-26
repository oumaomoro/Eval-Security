-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: 0004_remediation_engine.sql
-- Creates remediation_tasks and remediation_suggestions tables with RLS.
-- These tables power the DPO Dashboard's compliance patching workflow
-- and the Redline Studio's AI clause suggestion persistence.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── REMEDIATION TASKS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.remediation_tasks (
  id               BIGSERIAL PRIMARY KEY,
  workspace_id     BIGINT REFERENCES public.workspaces(id) ON DELETE CASCADE,
  contract_id      BIGINT REFERENCES public.contracts(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  severity         TEXT NOT NULL DEFAULT 'medium'
                     CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  status           TEXT NOT NULL DEFAULT 'identified'
                     CHECK (status IN ('identified', 'mitigation_planned', 'in_progress', 'mitigated', 'accepted', 'resolved')),
  assigned_to      TEXT,                    -- user email or ID
  due_date         TIMESTAMPTZ,
  gap_description  TEXT,
  suggested_clauses TEXT,
  remediation_notes TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast workspace-scoped queries (used by DPO metrics endpoint)
CREATE INDEX IF NOT EXISTS idx_remediation_tasks_workspace
  ON public.remediation_tasks (workspace_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_remediation_tasks_contract
  ON public.remediation_tasks (contract_id);

-- ── REMEDIATION SUGGESTIONS ───────────────────────────────────────────────────
-- Stores AI-generated clause redlines saved from the Redline Studio.
CREATE TABLE IF NOT EXISTS public.remediation_suggestions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id     BIGINT REFERENCES public.contracts(id) ON DELETE CASCADE,
  clause_title    TEXT NOT NULL,
  original_text   TEXT,
  suggested_text  TEXT NOT NULL,
  reason          TEXT,
  standard        TEXT,                     -- e.g. 'KDPA', 'GDPR', 'ISO27001'
  severity        TEXT DEFAULT 'medium'
                    CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_remediation_suggestions_contract
  ON public.remediation_suggestions (contract_id);

CREATE INDEX IF NOT EXISTS idx_remediation_suggestions_status
  ON public.remediation_suggestions (status, created_at DESC);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────────────
ALTER TABLE public.remediation_tasks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remediation_suggestions ENABLE ROW LEVEL SECURITY;

-- Service role (admin operations, DPO metrics aggregation)
CREATE POLICY "service_role_all_remediation_tasks"
  ON public.remediation_tasks FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_remediation_suggestions"
  ON public.remediation_suggestions FOR ALL
  USING (auth.role() = 'service_role');

-- Authenticated users see only their workspace's tasks
CREATE POLICY "users_own_workspace_remediation_tasks"
  ON public.remediation_tasks FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()::text
    )
  );

-- Authenticated users see suggestions for contracts in their workspace
CREATE POLICY "users_own_workspace_remediation_suggestions"
  ON public.remediation_suggestions FOR ALL
  USING (
    contract_id IN (
      SELECT c.id FROM public.contracts c
      JOIN public.workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE wm.user_id = auth.uid()::text
    )
  );

-- ── AUTO-UPDATE updated_at ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_remediation_tasks_updated_at ON public.remediation_tasks;
CREATE TRIGGER trg_remediation_tasks_updated_at
  BEFORE UPDATE ON public.remediation_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_remediation_suggestions_updated_at ON public.remediation_suggestions;
CREATE TRIGGER trg_remediation_suggestions_updated_at
  BEFORE UPDATE ON public.remediation_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
