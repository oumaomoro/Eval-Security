-- Costloci Enterprise — RLS Recursion Fix
-- Resolves Infinite Policy Loops on workspace_members and workspaces tables
-- Ensures Phase 27 stabilization for final certification.

BEGIN;

-- 1. DROP RECURSIVE POLICIES
DROP POLICY IF EXISTS "tenant_isolation_policy" ON contracts;
DROP POLICY IF EXISTS "member_isolation_policy" ON workspace_members;
DROP POLICY IF EXISTS "workspace_access_policy" ON workspaces;

-- 2. APPLY SECURE, NON-RECURSIVE POLICIES

-- Workspace Members: A user can see their own memberships
CREATE POLICY "member_self_access" ON workspace_members
  FOR ALL TO authenticated
  USING (auth.uid()::text = user_id);

-- Workspaces: A user can see any workspace they are a member of
-- (Using auth.uid() directly against a joined table in the policy is usually safe if it's the target table)
CREATE POLICY "workspace_membership_access" ON workspaces
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()::text
    )
  );

-- Contracts: Tenant isolation based on the active workspace context
-- (Usually handled by RPC or simple check)
CREATE POLICY "contract_tenant_isolation" ON contracts
  FOR ALL TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()::text
    )
  );

-- Clients: Same for clients
CREATE POLICY "client_tenant_isolation" ON clients
  FOR ALL TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()::text
    )
  );

-- 3. ENABLE RLS (Ensure it's actually on)
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- 4. REFRESH SCHEMA CACHE
-- Note: This is an internal Supabase step, usually triggered by DDL.
-- We'll assume the DDL above triggers it.

COMMIT;
