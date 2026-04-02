-- ============================================================
-- VECTOR RAG & ANALYSIS ACCURACY REMEDIATION
-- Target: Supabase (costloci.com / Project: ulercnwyckrcjcnrenzz)
-- ============================================================

-- 1. Infrastructure: Vector Search
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Core Entity: Gold Standard Clauses
CREATE TABLE IF NOT EXISTS public.gold_standard_clauses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    standard_name TEXT NOT NULL,
    clause_category TEXT NOT NULL CHECK (clause_category IN ('legal', 'security', 'compliance', 'financial', 'data_deletion', 'liability', 'notification')),
    sector TEXT NOT NULL DEFAULT 'general',
    jurisdiction TEXT NOT NULL DEFAULT 'global',
    clause_text TEXT NOT NULL,
    embedding VECTOR(1536),              -- OpenAI text-embedding-3-small
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS & Policies
ALTER TABLE public.gold_standard_clauses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read gold standards" ON public.gold_standard_clauses;
CREATE POLICY "Public read gold standards" ON public.gold_standard_clauses FOR SELECT USING (true);

-- Index for high-performance cosine similarity
CREATE INDEX IF NOT EXISTS gold_standard_clauses_embedding_idx ON public.gold_standard_clauses 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 3. High-Precision RPC: Dimensional Similarity Match
-- This version handles the exact parameters expected by the costloci-prod backend.
CREATE OR REPLACE FUNCTION match_clauses(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  category_filter text DEFAULT NULL,
  sector_filter text DEFAULT 'general',
  jurisdiction_filter text DEFAULT 'global'
)
RETURNS TABLE (
  id uuid,
  standard_name text,
  clause_category text,
  clause_text text,
  similarity float,
  is_exact_jurisdiction boolean
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    gsc.id,
    gsc.standard_name,
    gsc.clause_category,
    gsc.clause_text,
    (1 - (gsc.embedding <=> query_embedding))::float AS similarity,
    (gsc.jurisdiction = jurisdiction_filter) as is_exact_jurisdiction
  FROM public.gold_standard_clauses gsc
  WHERE 
    (category_filter IS NULL OR gsc.clause_category = category_filter)
    AND (gsc.sector = sector_filter OR gsc.sector = 'general')
    AND (gsc.jurisdiction = jurisdiction_filter OR gsc.jurisdiction = 'global')
    AND (1 - (gsc.embedding <=> query_embedding)) > match_threshold
  ORDER BY 
    (gsc.jurisdiction = jurisdiction_filter) DESC,
    gsc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 4. Contract Schema Hardening (Ensuring ingestion accuracy)
DO $$ 
BEGIN
  -- Organizational Isolation
  BEGIN ALTER TABLE public.contracts ADD COLUMN organization_id UUID; EXCEPTION WHEN duplicate_column THEN END;
  
  -- RAG Metadata
  BEGIN ALTER TABLE public.contracts ADD COLUMN detected_sector TEXT; EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.contracts ADD COLUMN detected_jurisdiction TEXT; EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.contracts ADD COLUMN agreement_type TEXT; EXCEPTION WHEN duplicate_column THEN END;
  
  -- Accuracy Metrics
  BEGIN ALTER TABLE public.contracts ADD COLUMN gold_standard_similarity JSONB DEFAULT '{}'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.contracts ADD COLUMN rAG_confidence_score FLOAT DEFAULT 0.0; EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.contracts ADD COLUMN gold_standard_id UUID REFERENCES public.gold_standard_clauses(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_column THEN END;
END $$;

-- 5. Seed Initial "Proof of Accuracy" Gold Standards
-- Note: Embeddings are placeholders (0,0...). Real embeddings are typically inserted via a script 
-- or automatically generated during the first "Manual Overwrite" in the Admin UI.
INSERT INTO public.gold_standard_clauses (standard_name, clause_category, sector, jurisdiction, clause_text) VALUES
('Costloci Global DPA Standard', 'compliance', 'general', 'global', 'The Processor shall delete all personal data within 30 days of the termination of this Agreement and provide written certification of such deletion.'),
('Enterprise SIEM Liability Cap', 'legal', 'security', 'global', 'The total aggregate liability of the Vendor for any data breach related to the platform shall be capped at 5x the annual fees paid.'),
('East Africa Data Localization', 'compliance', 'fintech', 'kenya/mea', 'Personal data of residents in Kenya shall be processed and stored on servers located within the territory of Kenya unless explicit consent is provided.')
ON CONFLICT (id) DO NOTHING;

-- Log the repair
INSERT INTO public.audit_logs (user_id, action_type, description)
SELECT id, 'SYSTEM_SCHEMA_REMEDIATION', 'Vector RAG and accurately analysis infrastructure restored to production build.'
FROM public.profiles WHERE role = 'admin' LIMIT 1;
