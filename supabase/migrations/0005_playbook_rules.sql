-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: 0005_playbook_rules.sql
-- Creates playbooks and playbook_rules tables with RLS.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.playbooks (
  id           BIGSERIAL PRIMARY KEY,
  workspace_id BIGINT REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  category     TEXT,
  is_active    BOOLEAN DEFAULT true NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_playbooks_workspace_id ON public.playbooks(workspace_id);

CREATE TABLE IF NOT EXISTS public.playbook_rules (
  id          BIGSERIAL PRIMARY KEY,
  playbook_id BIGINT REFERENCES public.playbooks(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  condition   JSONB NOT NULL,
  action      JSONB NOT NULL,
  priority    INTEGER DEFAULT 0 NOT NULL,
  is_active   BOOLEAN DEFAULT true NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_playbook_rules_playbook_id ON public.playbook_rules(playbook_id);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────────────
ALTER TABLE public.playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_rules ENABLE ROW LEVEL SECURITY;

-- Policy for service_role bypass
CREATE POLICY "service_role_all_playbooks" ON public.playbooks 
  FOR ALL TO service_role USING (true);

CREATE POLICY "service_role_all_playbook_rules" ON public.playbook_rules 
  FOR ALL TO service_role USING (true);

-- Policy for user access via workspace membership
CREATE POLICY "users_own_workspace_playbooks" ON public.playbooks 
  FOR ALL TO authenticated 
  USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid()::text
    )
  );

CREATE POLICY "users_own_workspace_playbook_rules" ON public.playbook_rules 
  FOR ALL TO authenticated 
  USING (
    playbook_id IN (
      SELECT p.id FROM public.playbooks p
      JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
      WHERE wm.user_id = auth.uid()::text
    )
  );

-- ── AUTO-UPDATE updated_at ────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_playbooks_updated_at ON public.playbooks;
CREATE TRIGGER trg_playbooks_updated_at
  BEFORE UPDATE ON public.playbooks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_playbook_rules_updated_at ON public.playbook_rules;
CREATE TRIGGER trg_playbook_rules_updated_at
  BEFORE UPDATE ON public.playbook_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
