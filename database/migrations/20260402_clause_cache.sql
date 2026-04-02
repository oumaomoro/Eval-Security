-- ============================================================
-- CLAUSE CACHE TABLE
-- Stores ROI-optimized cached results from Vector RAG + GPT-4
-- analysis to prevent redundant expensive LLM calls.
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.clause_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clause_hash TEXT NOT NULL,
    framework_context TEXT NOT NULL,
    analysis_json JSONB,
    times_served INT DEFAULT 1,
    last_hit TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint to prevent duplicate caching
CREATE UNIQUE INDEX IF NOT EXISTS clause_cache_hash_context_idx
    ON public.clause_cache (clause_hash, framework_context);

-- Performance index for ROI lookups
CREATE INDEX IF NOT EXISTS clause_cache_hash_idx ON public.clause_cache (clause_hash);

-- RLS: Only backend service role can read/write cache
ALTER TABLE public.clause_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access to clause_cache" ON public.clause_cache;
CREATE POLICY "Service role full access to clause_cache" ON public.clause_cache
    FOR ALL USING (true);
