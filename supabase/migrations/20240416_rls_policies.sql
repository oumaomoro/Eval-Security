-- ENTERPRISE RLS HARDENING - SOVEREIGN ISOLATION V3
-- This script enables Row Level Security (RLS) on all multi-tenant tables
-- and enforces workspace boundaries based on the 'app.current_workspace_id' setting.

-- 1. Helper Function to set context (for manual testing/DB access)
CREATE OR REPLACE FUNCTION set_workspace_context(wid TEXT) RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_workspace_id', wid, false);
END;
$$ LANGUAGE plpgsql;

-- 2. Enable RLS on all tables
DO $$ 
DECLARE 
    tbl_name TEXT;
BEGIN 
    FOR tbl_name IN (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public') 
    LOOP 
        EXECUTE 'ALTER TABLE ' || quote_ident(tbl_name) || ' ENABLE ROW LEVEL SECURITY;';
    END LOOP; 
END $$;

-- 3. Define Per-Table Policies

-- Workspaces: Users can only see the workspace they are currently in.
CREATE POLICY workspace_isolation_workspaces ON workspaces
    FOR ALL USING (id = current_setting('app.current_workspace_id', true)::int);

-- Workspace Members
CREATE POLICY workspace_isolation_members ON workspace_members
    FOR ALL USING (workspace_id = current_setting('app.current_workspace_id', true)::int);

-- Multi-Tenant Data Tables
DO $$ 
DECLARE 
    tbl_name TEXT;
    tenant_tables TEXT[] := ARRAY[
        'clients', 'contracts', 'compliance_audits', 'risks', 'clause_library', 
        'savings_opportunities', 'reports', 'vendor_scorecards', 'audit_logs', 
        'remediation_suggestions', 'playbooks', 'notification_channels', 
        'comments', 'contract_comparisons', 'regulatory_alerts', 
        'infrastructure_logs', 'billing_telemetry', 'clauses'
    ];
BEGIN 
    FOREACH tbl_name IN ARRAY tenant_tables 
    LOOP 
        EXECUTE 'DROP POLICY IF EXISTS workspace_isolation ON ' || quote_ident(tbl_name);
        EXECUTE 'CREATE POLICY workspace_isolation ON ' || quote_ident(tbl_name) || 
                ' FOR ALL USING (workspace_id = current_setting(''app.current_workspace_id'', true)::int)';
    END LOOP; 
END $$;

-- 4. Special Case: User Playbooks (Join table)
CREATE POLICY workspace_isolation_user_playbooks ON user_playbooks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM playbooks p 
            WHERE p.id = playbook_id 
            AND p.workspace_id = current_setting('app.current_workspace_id', true)::int
        )
    );

-- 5. Backfill workspace_id for existing tenants (Example logic)
-- This assumes a relationship exists that can resolve the workspace.
-- For contracts: UPDATE contracts SET workspace_id = (SELECT workspace_id FROM workspace_members WHERE user_id = created_by LIMIT 1) WHERE workspace_id IS NULL;
-- (Actual backfill should be run manually based on data audit)

COMMIT;
