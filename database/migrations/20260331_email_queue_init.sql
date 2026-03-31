-- Production Email Queue Schema for Supabase
-- This table enables asynchronous email dispatch with retries and backoff

CREATE TABLE IF NOT EXISTS public.email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "to" TEXT NOT NULL,
    subject TEXT NOT NULL,
    html TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')) DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    next_attempt TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    last_error TEXT
);

-- Index for efficient background processing
CREATE INDEX IF NOT EXISTS idx_email_queue_status_next_attempt 
ON public.email_queue (status, next_attempt) 
WHERE status = 'pending';

-- RLS Policy (Secure from public access)
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow Service Role Only" 
ON public.email_queue 
USING (auth.jwt()->>'role' = 'service_role');
