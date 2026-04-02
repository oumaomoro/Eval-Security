-- ============================================================
-- CORRECTIVE MIGRATION: Fix Missing Profiles Columns
-- Run this in your Supabase SQL Editor (Project: ulercnwyckrcjcnrenzz)
-- ============================================================

-- 1. Add missing 'email' column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;
END $$;

-- 2. Add missing 'tier' column (alias for 'plan' - used by billing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='tier'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN tier TEXT DEFAULT 'free';
  END IF;
END $$;

-- 3. Add missing 'api_key' column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='api_key'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN api_key TEXT;
    ALTER TABLE public.profiles ADD COLUMN api_key_hashed BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 4. Refresh Supabase schema cache (PostgREST reload)
NOTIFY pgrst, 'reload schema';

-- 5. Ensure email_queue table exists for Resend dispatch
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "to" TEXT NOT NULL,
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  attempts INTEGER DEFAULT 0,
  next_attempt TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on email_queue (service role bypasses)
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- 6. Ensure gold_standards table exists for health checks
CREATE TABLE IF NOT EXISTS public.gold_standards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT,
  sector TEXT DEFAULT 'general',
  jurisdiction TEXT DEFAULT 'global',
  text TEXT,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Backfill email from auth.users for existing profiles
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- Done! Run NOTIFY pgrst, 'reload schema'; again if needed.
SELECT 'Migration complete. Profiles table updated.' AS status;
