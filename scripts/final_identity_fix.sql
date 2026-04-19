-- Costloci Enterprise — Final Identity Stabilization
-- Ensures all users are provisioned as admins by default for the Enterprise Pilot.
-- Fixes RLS for the profiles table to prevent unauthorized lookup failures.

BEGIN;

-- 1. Correct Default Roles
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'admin';
UPDATE profiles SET role = 'admin' WHERE role IS NULL OR role = 'analyst' OR role = 'viewer';

-- 2. Profiles RLS: Ensure users can manage their own identity
DROP POLICY IF EXISTS "profiles_self_access" ON profiles;
CREATE POLICY "profiles_self_access" ON profiles
  FOR ALL TO authenticated
  USING (auth.uid() = id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. FINAL SCHEMA RELOAD
NOTIFY pgrst, 'reload schema';

COMMIT;
