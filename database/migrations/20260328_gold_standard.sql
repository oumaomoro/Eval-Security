-- Enable the pgvector extension to work with embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Gold Standard Clauses: Reference points for what "good" legal language looks like
CREATE TABLE IF NOT EXISTS public.gold_standard_clauses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    standard_name TEXT NOT NULL,          -- e.g. "CyberOptimize Enterprise DPA 2026"
    clause_category TEXT NOT NULL,        -- e.g. "data_deletion", "liability", "notification"
    clause_text TEXT NOT NULL,            -- The actual text of the gold standard clause
    embedding VECTOR(1536),              -- OpenAI text-embedding-3-small vector
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Gold Standard Clauses
ALTER TABLE public.gold_standard_clauses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read gold standards" ON public.gold_standard_clauses FOR SELECT USING (true);
CREATE POLICY "Admins can manage gold standards" ON public.gold_standard_clauses FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Index for fast similarity searching using Inner Product (good for normalized vectors from OpenAI)
CREATE INDEX IF NOT EXISTS gold_standard_clauses_embedding_idx ON public.gold_standard_clauses 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- RPC for similarity search
CREATE OR REPLACE FUNCTION match_clauses(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  category_filter text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  standard_name text,
  clause_category text,
  clause_text text,
  similarity float
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
    1 - (gsc.embedding <=> query_embedding) AS similarity
  FROM public.gold_standard_clauses gsc
  WHERE (category_filter IS NULL OR gsc.clause_category = category_filter)
    AND 1 - (gsc.embedding <=> query_embedding) > match_threshold
  ORDER BY gsc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Add column to contracts to store similarity scores vs Gold Standard
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS gold_standard_similarity JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS gold_standard_id UUID REFERENCES public.gold_standard_clauses(id) ON DELETE SET NULL;
