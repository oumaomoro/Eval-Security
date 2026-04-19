-- Costloci Enterprise — Adding missing foreign keys for PostgREST relationships

BEGIN;

-- 1. Ensure workspace_members -> workspaces FK exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'workspace_members_workspace_id_fkey'
    ) THEN
        ALTER TABLE workspace_members
        ADD CONSTRAINT workspace_members_workspace_id_fkey
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Check if clients -> workspaces FK is missing for similar reasons
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'clients_workspace_id_fkey'
    ) THEN
        ALTER TABLE clients
        ADD CONSTRAINT clients_workspace_id_fkey
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
