-- Migration: Phase 11 Refinement (Global Scaling & Cost-Efficiency)
-- Date: 2026-03-28
-- Description: Adds Multi-Tenant Organization scoping and Sector/Jurisdiction awareness for Gold Standards.

-- 1. Add Organization Table for MSP Multi-Tenancy
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    industry_sector TEXT,
    primary_jurisdiction TEXT,
    branding JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add Organization Link to Profiles
ALTER TABLE IF EXISTS profiles 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- 3. Enhance Contracts for Sector & Jurisdiction Detection
ALTER TABLE IF EXISTS contracts
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS detected_sector TEXT,
ADD COLUMN IF NOT EXISTS detected_jurisdiction TEXT;

-- 4. Enhance Gold Standard Library for Global Accuracy
ALTER TABLE IF EXISTS gold_standard_clauses
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS industry_sector TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS jurisdiction TEXT DEFAULT 'global';

-- 5. Updated match_clauses RPC with Sector & Jurisdiction awareness
-- Run this in your Supabase SQL Editor to replace the previous version.
/*
CREATE OR REPLACE FUNCTION match_clauses (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  category_filter text DEFAULT NULL,
  sector_filter text DEFAULT NULL,
  jurisdiction_filter text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  standard_name text,
  clause_category text,
  clause_text text,
  industry_sector text,
  jurisdiction text,
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
    gsc.industry_sector,
    gsc.jurisdiction,
    1 - (gsc.embedding <=> query_embedding) AS similarity
  FROM gold_standard_clauses gsc
  WHERE (category_filter IS NULL OR gsc.clause_category = category_filter)
    AND (sector_filter IS NULL OR gsc.industry_sector = sector_filter OR gsc.industry_sector = 'general')
    AND (jurisdiction_filter IS NULL OR gsc.jurisdiction = jurisdiction_filter OR gsc.jurisdiction = 'global')
    AND 1 - (gsc.embedding <=> query_embedding) > match_threshold
  ORDER BY gsc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
*/
