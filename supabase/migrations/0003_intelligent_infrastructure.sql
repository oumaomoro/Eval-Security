-- Phase 27: Intelligent Infrastructure Update
-- Adds Semantic Caching and Regional Sharding support

-- 1. AI Cache for Semantic Redlining
CREATE TABLE IF NOT EXISTS ai_cache (
  id SERIAL PRIMARY KEY,
  prompt_hash TEXT NOT NULL UNIQUE,
  response TEXT NOT NULL,
  provider TEXT,
  model TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_cache_hash ON ai_cache(prompt_hash);

-- 2. Regional Sharding for Sovereign Compliance
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'east-africa';
COMMENT ON COLUMN workspaces.region IS 'Target jurisdiction for data residency (east-africa, south-africa, etc.)';

-- 3. Telemetry Indexing for Temporal Forecasting
CREATE INDEX IF NOT EXISTS idx_contracts_renewal_date ON contracts(renewal_date);

-- 4. Real-time Collaboration Presence
CREATE TABLE IF NOT EXISTS presence (
  id SERIAL PRIMARY KEY,
  workspace_id INTEGER REFERENCES workspaces(id),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presence_resource ON presence(resource_type, resource_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_presence_unique ON presence(workspace_id, user_id, resource_type, resource_id);
