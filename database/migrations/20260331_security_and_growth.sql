-- API Key Security Hardening (2026-03-31)
-- Transition from Plaintext to Bcrypt Hashing

-- Create a helper function if needed, but primarily we will handle hashing in Node.js
-- We rotate the existing keys or simply ensure new ones are hashed.

-- Step 1: Add a flag to identify hashed vs plaintext keys during transition (optional but safer)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS api_key_hashed BOOLEAN DEFAULT FALSE;

-- Step 2: Ensure the api_key column is long enough for bcrypt hashes (usually 60 chars)
ALTER TABLE public.profiles ALTER COLUMN api_key TYPE TEXT;

-- Step 3: Create the Onboarding Tracking table for the Drip Campaign
CREATE TABLE IF NOT EXISTS public.onboarding_emails_sent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    milestone TEXT NOT NULL, -- e.g., 'day_1', 'day_3'
    sent_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, milestone)
);

-- Enable RLS for the tracking table
ALTER TABLE public.onboarding_emails_sent ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow Service Role Only Onboarding" ON public.onboarding_emails_sent USING (auth.jwt()->>'role' = 'service_role');
