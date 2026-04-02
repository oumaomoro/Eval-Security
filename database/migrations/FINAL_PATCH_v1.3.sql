-- ============================================================
-- FINAL PRODUCTION MASTER PATCH v1.3.5 (Infrastructure Sync)
-- Ensures ALL tables, RLS policies, and triggers exist for 
-- Costloci Production. One-click initialization/recovery.
-- ============================================================

-- 0. Safety: Core Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Profiles (Resilient)
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT,
  company_name    TEXT,
  role            TEXT DEFAULT 'analyst' CHECK (role IN ('admin', 'analyst', 'viewer')),
  tier            TEXT DEFAULT 'free',
  plan            TEXT DEFAULT 'starter',
  trial_start     TIMESTAMPTZ DEFAULT NOW(),
  trial_end       TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days',
  region_code     TEXT DEFAULT 'KE',
  integrations    JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_own_profile" ON public.profiles;
CREATE POLICY "user_own_profile" ON public.profiles FOR ALL USING (auth.uid() = id);

-- 2. Core Entities: Clients & Contracts
CREATE TABLE IF NOT EXISTS public.clients (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name    TEXT NOT NULL,
  industry        TEXT,
  annual_budget   NUMERIC(15,2),
  contact_email   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_own_clients" ON public.clients;
CREATE POLICY "user_own_clients" ON public.clients FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.contracts (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id             UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  vendor_name           TEXT NOT NULL,
  product_service       TEXT,
  category              TEXT,
  annual_cost           NUMERIC(12,2),
  monthly_cost          NUMERIC(12,2),
  renewal_date          DATE,
  file_url              TEXT,
  status                TEXT DEFAULT 'active',
  ai_analysis           JSONB DEFAULT '{}',
  detected_sector       TEXT,
  detected_jurisdiction TEXT,
  agreement_type        TEXT,
  gold_standard_id      UUID,
  rag_confidence_score  FLOAT DEFAULT 0.0,
  organization_id       UUID,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_own_contracts" ON public.contracts;
CREATE POLICY "user_own_contracts" ON public.contracts FOR ALL USING (auth.uid() = user_id);

-- 3. Vector RAG Infrastructure
CREATE TABLE IF NOT EXISTS public.gold_standard_clauses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    standard_name TEXT NOT NULL,
    clause_category TEXT NOT NULL,
    sector TEXT NOT NULL DEFAULT 'general',
    jurisdiction TEXT NOT NULL DEFAULT 'global',
    clause_text TEXT NOT NULL,
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.gold_standard_clauses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read gold standards" ON public.gold_standard_clauses;
CREATE POLICY "Public read gold standards" ON public.gold_standard_clauses FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.clause_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clause_hash TEXT NOT NULL,
    framework_context TEXT NOT NULL,
    analysis_json JSONB,
    times_served INT DEFAULT 1,
    last_hit TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS clause_cache_hash_context_idx ON public.clause_cache (clause_hash, framework_context);
ALTER TABLE public.clause_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role access" ON public.clause_cache;
CREATE POLICY "Service role access" ON public.clause_cache FOR ALL USING (true);

-- 4. Audit, Compliance & ROI
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    description TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own logs" ON public.audit_logs;
CREATE POLICY "Users view own logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.compliance_audits (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  audit_name                TEXT NOT NULL,
  status                    TEXT DEFAULT 'completed',
  score                     INTEGER DEFAULT 0,
  findings                  JSONB DEFAULT '[]',
  created_at                TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.compliance_audits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_own_audits" ON public.compliance_audits;
CREATE POLICY "user_own_audits" ON public.compliance_audits FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.savings_opportunities (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_id       UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  opportunity_type  TEXT,
  potential_savings NUMERIC(12,2),
  status            TEXT DEFAULT 'identified',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.savings_opportunities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_own_savings" ON public.savings_opportunities;
CREATE POLICY "user_own_savings" ON public.savings_opportunities FOR ALL USING (auth.uid() = user_id);

-- 5. System Tables (Webhook, Feedback, Regions)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider        TEXT NOT NULL,
  event_type      TEXT NOT NULL,
  payload         JSONB,
  processed       BOOLEAN DEFAULT FALSE,
  processed_at    TIMESTAMPTZ,
  error           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.regions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_code      TEXT UNIQUE NOT NULL,
  custom_ai_prompt  TEXT NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_regions" ON public.regions;
CREATE POLICY "public_read_regions" ON public.regions FOR SELECT USING (true);

-- 6. Functions & Triggers
CREATE OR REPLACE FUNCTION match_clauses(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  category_filter text DEFAULT NULL,
  sector_filter text DEFAULT 'general',
  jurisdiction_filter text DEFAULT 'global'
)
RETURNS TABLE (
  id uuid, standard_name text, clause_category text,
  clause_text text, similarity float, is_exact_jurisdiction boolean
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY SELECT gsc.id, gsc.standard_name, gsc.clause_category, gsc.clause_text,
    (1 - (gsc.embedding <=> query_embedding))::float AS similarity,
    (gsc.jurisdiction = jurisdiction_filter) as is_exact_jurisdiction
  FROM public.gold_standard_clauses gsc
  WHERE (category_filter IS NULL OR gsc.clause_category = category_filter)
    AND (gsc.sector = sector_filter OR gsc.sector = 'general')
    AND (gsc.jurisdiction = jurisdiction_filter OR gsc.jurisdiction = 'global')
    AND gsc.embedding IS NOT NULL AND (1 - (gsc.embedding <=> query_embedding)) > match_threshold
  ORDER BY (gsc.jurisdiction = jurisdiction_filter) DESC, gsc.embedding <=> query_embedding LIMIT match_count;
END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, tier, plan, trial_start, trial_end)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'analyst', 'free', 'starter', NOW(), NOW() + INTERVAL '14 days')
  ON CONFLICT (id) DO UPDATE SET updated_at = EXCLUDED.updated_at;
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Data Reconciliation & Seeding
DO $$ BEGIN
    -- Harden profiles constraints
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_tier_check;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_tier_check CHECK (tier IN ('free', 'starter', 'pro', 'professional', 'enterprise', 'api', 'admin'));
    UPDATE public.profiles SET tier = plan WHERE tier IS NULL AND plan IS NOT NULL;
END $$;

INSERT INTO public.regions (country_code, custom_ai_prompt) VALUES
  ('KE', 'Verify compliance against Kenyan Data Protection Act (KDPA) and Central Bank Guidelines.'),
  ('NG', 'Verify compliance against Nigeria Data Protection Regulation (NDPR).'),
  ('EG', 'Verify compliance against Egypt Personal Data Protection Law (PDPL).'),
  ('AE', 'Verify compliance against UAE Federal Data Protection Law.')
ON CONFLICT (country_code) DO NOTHING;

INSERT INTO public.gold_standard_clauses (standard_name, clause_category, sector, jurisdiction, clause_text) VALUES
  ('Costloci Global DPA Standard', 'compliance', 'general', 'global', 'The Processor shall delete all personal data within 30 days of the termination of this Agreement and provide written certification of such deletion.'),
  ('Enterprise SIEM Liability Cap', 'legal', 'security', 'global', 'The total aggregate liability of the Vendor for any data breach related to the platform shall be capped at 5x the annual fees paid.'),
  ('East Africa Data Localization', 'compliance', 'fintech', 'kenya/mea', 'Personal data of residents in Kenya shall be processed and stored on servers located within the territory of Kenya unless explicit consent is provided.')
ON CONFLICT DO NOTHING;

-- Complete.
SELECT 'MASTER_PATCH_v1.3.5 applied successfully' AS status;
