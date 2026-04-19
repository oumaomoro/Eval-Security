-- CyberOptimize Phase 26: Enterprise RLS Hardening
-- Enforces multi-tenant isolation at the database level.

DO $$
DECLARE
    t text;
    tables_to_harden text[] := ARRAY[
        'clients', 'contracts', 'risks', 'risk_register', 'compliance_audits', 
        'reports', 'vendor_scorecards', 'audit_logs', 'clause_library', 
        'savings_opportunities', 'comments', 'contract_comparisons', 
        'regulatory_alerts', 'infrastructure_logs', 'billing_telemetry', 
        'clauses', 'remediation_suggestions', 'playbooks', 
        'marketplace_listings', 'marketplace_purchases', 'notification_channels',
        'audit_rulesets', 'continuous_monitoring', 'remediation_tasks'
    ];
BEGIN
    FOR t IN SELECT unnest(tables_to_harden) LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
        
        -- Drop existing policies to ensure idempotency
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I;', t);
        
        -- Create standard workspace-based isolation policy
        -- Exception for marketplace_purchases which uses buyer_workspace_id as primary check
        IF t = 'marketplace_purchases' THEN
            EXECUTE format('
                CREATE POLICY tenant_isolation_policy ON %I 
                AS PERMISSIVE FOR ALL TO authenticated 
                USING (
                    buyer_workspace_id IN (
                        SELECT workspace_id FROM workspace_members WHERE user_id::text = auth.uid()::text
                    )
                )
                WITH CHECK (
                    buyer_workspace_id IN (
                        SELECT workspace_id FROM workspace_members WHERE user_id::text = auth.uid()::text
                    )
                );', t);
        ELSE
            EXECUTE format('
                CREATE POLICY tenant_isolation_policy ON %I 
                AS PERMISSIVE FOR ALL TO authenticated 
                USING (
                    workspace_id IN (
                        SELECT workspace_id FROM workspace_members WHERE user_id::text = auth.uid()::text
                    )
                )
                WITH CHECK (
                    workspace_id IN (
                        SELECT workspace_id FROM workspace_members WHERE user_id::text = auth.uid()::text
                    )
                );', t);
        END IF;
        
        RAISE NOTICE 'Hardened RLS for table: %', t;
    END LOOP;
END $$;

-- Special Case: Workspaces table
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS workspace_access_policy ON workspaces;
CREATE POLICY workspace_access_policy ON workspaces
AS PERMISSIVE FOR ALL TO authenticated
USING (
    id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id::text = auth.uid()::text
    )
);

-- Special Case: Workspace Members
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS member_isolation_policy ON workspace_members;
CREATE POLICY member_isolation_policy ON workspace_members
AS PERMISSIVE FOR ALL TO authenticated
USING (
    workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id::text = auth.uid()::text
    )
);

-- Profiles access (can see themselves and their workspace peers)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profile_isolation_policy ON profiles;
CREATE POLICY profile_isolation_policy ON profiles
AS PERMISSIVE FOR ALL TO authenticated
USING (
    id::text = auth.uid()::text OR
    id::text IN (
        SELECT user_id::text FROM workspace_members WHERE workspace_id IN (
            SELECT workspace_id FROM workspace_members WHERE user_id::text = auth.uid()::text
        )
    )
);
