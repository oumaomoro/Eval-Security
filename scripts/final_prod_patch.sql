-- ==========================================
-- COSTLOCI ENTERPRISE FINAL PRODUCTION PATCH
-- Phase 27: Intelligent Infrastructure Hardening
-- ==========================================

-- 1. Ensure Presence Tracking Table exists for real-time collaboration
CREATE TABLE IF NOT EXISTS presence (
    id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL,
    user_id UUID NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, user_id, resource_type, resource_id)
);

-- 2. Ensure AI Semantic Cache exists for cost/latency optimization
CREATE TABLE IF NOT EXISTS ai_cache (
    id BIGSERIAL PRIMARY KEY,
    prompt_hash TEXT UNIQUE NOT NULL,
    response TEXT NOT NULL,
    provider TEXT,
    model TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. High-Performance Indexes for Enterprise Scale
CREATE INDEX IF NOT EXISTS idx_presence_resource ON presence (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON presence (last_seen_at);
CREATE INDEX IF NOT EXISTS idx_ai_cache_hash ON ai_cache (prompt_hash);

-- 4. Enable RLS on new infrastructure
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Presence (Internal heartbeat)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'presence_visibility') THEN
        CREATE POLICY presence_visibility ON presence 
        FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'presence_update') THEN
        CREATE POLICY presence_update ON presence 
        FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- 6. RLS Policies for AI Cache (Internal Optimization)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ai_cache_internal') THEN
        CREATE POLICY ai_cache_internal ON ai_cache 
        FOR ALL USING (true);
    END IF;
END $$;

-- 7. Force Schema Cache Reload
NOTIFY pgrst, 'reload schema';

COMMIT;
