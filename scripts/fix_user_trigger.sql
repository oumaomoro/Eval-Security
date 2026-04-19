-- Replace the handle_new_user trigger to inherently default to 'admin'
-- This avoids the race condition where 'analyst' gets momentarily flashed and disrupts RBAC.

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, tier, plan, trial_start, trial_end)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
    'admin', 
    'starter', 
    'starter', 
    NOW(), 
    NOW() + INTERVAL '14 days'
  )
  ON CONFLICT (id) DO UPDATE SET 
    updated_at = NOW(),
    role = 'admin';  -- Ensure role is forced to admin on conflict/update
  RETURN NEW;
END;
$$;

COMMIT;
