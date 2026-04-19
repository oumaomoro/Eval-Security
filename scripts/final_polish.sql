-- Costloci Enterprise — Final Schema Polish
-- Adds missing analytics and standard columns to workspaces
-- Resolves the last remaining 500 errors in the E2E suite.

BEGIN;

-- Workspaces: Add missing telemetry and configuration columns
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS api_usage_count INTEGER DEFAULT 0;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS api_usage_reset_date TIMESTAMP;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS active_standards JSONB DEFAULT '[]';

-- Ensure profiles table also has the role column if missing (some old migrations used 'profiles')
-- Based on shared/schema.ts, users table is authoritative and mapped to 'profiles'.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'viewer';

-- REFRESH CACHE
NOTIFY pgrst, 'reload schema';

COMMIT;
