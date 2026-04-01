-- RAG Accuracy Hardening: Adding Multi-Dimensional Legal Filtering
-- (Sector, Jurisdiction, and Confidence Priority)

-- 1. Update Gold Standard Schema
ALTER TABLE public.gold_standard_clauses ADD COLUMN IF NOT EXISTS sector TEXT NOT NULL DEFAULT 'general';
ALTER TABLE public.gold_standard_clauses ADD COLUMN IF NOT EXISTS jurisdiction TEXT NOT NULL DEFAULT 'global';

-- 2. Create index for fast filtering on metadata
CREATE INDEX IF NOT EXISTS gold_standard_clauses_metadata_idx ON public.gold_standard_clauses (sector, jurisdiction, clause_category);

-- 3. Re-define RPC for Intelligent Dimensional Similarity Search
-- This new version prioritized exact matches in the specified Jurisdiction/Sector.
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
    -- Ranking logic: Calculate base similarity
    (1 - (gsc.embedding <=> query_embedding)) AS similarity,
    -- Flag if this is a perfect jurisdiction match
    (gsc.jurisdiction = jurisdiction_filter) as is_exact_jurisdiction
  FROM public.gold_standard_clauses gsc
  WHERE 
    -- Required: Match the legal category
    (category_filter IS NULL OR gsc.clause_category = category_filter)
    -- Filtering: Match Sector exactly (or general) and Jurisdiction EXACTLY.
    AND (gsc.sector = sector_filter OR gsc.sector = 'general')
    AND gsc.jurisdiction = jurisdiction_filter
    -- Threshold: Ensure it's legally relevant
    AND (1 - (gsc.embedding <=> query_embedding)) > match_threshold
  ORDER BY 
    -- Primary sort by exact match (boost regional accuracy)
    (gsc.jurisdiction = jurisdiction_filter) DESC,
    -- Secondary sort by vector similarity
    gsc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 4. Add confidence tracking to contracts for UI visualization
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS rAG_confidence_score FLOAT DEFAULT 0.0;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS detected_jurisdiction TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS detected_sector TEXT;
