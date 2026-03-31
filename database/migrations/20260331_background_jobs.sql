-- Background Job Tracking (2026-03-31)
-- Enables asynchronous processing for Strategic Pack generation

CREATE TABLE IF NOT EXISTS public.background_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL, -- e.g., 'strategic_pack_generation'
    status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'failed')) DEFAULT 'queued',
    payload JSONB, -- Input parameters for the job
    result JSONB, -- Output metadata (e.g., file_url)
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for status polling
CREATE INDEX IF NOT EXISTS idx_background_jobs_user_status ON public.background_jobs(user_id, status);

-- Enable RLS
ALTER TABLE public.background_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own jobs" ON public.background_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service Role Full Access" ON public.background_jobs USING (auth.jwt()->>'role' = 'service_role');
