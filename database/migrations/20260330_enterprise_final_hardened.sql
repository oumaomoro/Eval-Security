-- ============================================================
-- CyberOptimize — Enterprise Final Hardening & Expansion
-- Comprehensive Idempotent Migration for Phase 27.0
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Signatures Table (SignNow Tracking)
CREATE TABLE IF NOT EXISTS public.signatures (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    contract_id             UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
    signer_email            TEXT NOT NULL,
    signnow_document_id     TEXT,
    embedded_url            TEXT,
    status                  TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'signed', 'expired', 'declined')),
    metadata                JSONB DEFAULT '{}',
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DPO Module (Contacts & Governance)
CREATE TABLE IF NOT EXISTS public.dpo_contacts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    email           TEXT NOT NULL,
    phone           TEXT,
    assigned_date   DATE DEFAULT CURRENT_DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dpo_tasks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    due_date        DATE,
    status          TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'blocked')),
    priority        TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    category        TEXT DEFAULT 'compliance',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Market Benchmarks (Cost Optimizer ROI)
CREATE TABLE IF NOT EXISTS public.market_benchmarks (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category            TEXT NOT NULL, -- 'firewall', 'edr', 'cloud_security', 'endpoint'
    avg_annual_cost     NUMERIC(12,2) NOT NULL,
    currency            VARCHAR(10) DEFAULT 'USD',
    region_code         VARCHAR(10) DEFAULT 'GLO', -- 'KE', 'US', 'EU', 'GLO'
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Extend Profiles for Billing & Audit
DO $$ 
BEGIN
  BEGIN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
  EXCEPTION WHEN duplicate_column THEN END;
  
  BEGIN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT false;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS industry TEXT;
  EXCEPTION WHEN duplicate_column THEN END;
END $$;

-- 5. Seeding International Standards in Regions
INSERT INTO public.regions (code, name, regulations, reporter_prompt) VALUES
('EU', 'European Union', '["GDPR"]', 'Evaluate contract against the General Data Protection Regulation (GDPR). Focus on Article 28 data processor obligations, sub-processing restrictions, and mandatory breach notification timelines.'),
('CA', 'California (USA)', '["CCPA", "CPRA"]', 'Analyze compliance with CCPA/CPRA. Verify specific "Do Not Sell My Info" disclosures, consumer right to access/delete, and appropriate service provider contracting.'),
('CN', 'Canada', '["PIPEDA"]', 'Assess alignment with Personal Information Protection and Electronic Documents Act (PIPEDA). Focus on individual access rights and the requirement for "comparable level of protection" during processing.'),
('JP', 'Japan', '["APPI"]', 'Check against the Act on the Protection of Personal Information (APPI). Emphasize requirements for cross-border data transfer to countries without adequacy status.'),
('BR', 'Brazil', '["LGPD"]', 'Evaluate against Lei Geral de Proteção de Dados (LGPD). Focus on the legal bases for processing and the requirement for an appointed DPO/Person in Charge.')
ON CONFLICT (code) DO UPDATE SET 
    regulations = EXCLUDED.regulations,
    reporter_prompt = EXCLUDED.reporter_prompt;

-- 6. Seed Industry Average Costs (Market Benchmarks)
INSERT INTO public.market_benchmarks (category, avg_annual_cost) VALUES
('firewall', 25000),
('edr', 15000),
('cloud_security', 35000),
('endpoint', 10000),
('siem', 45000),
('monitoring', 12000),
('vulnerability_management', 18000)
ON CONFLICT DO NOTHING;

-- 7. Update handle_new_user Trigger for 14-day Trials
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, tier, trial_start, trial_end, trial_used)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    'user',
    'free',
    NOW(),
    NOW() + INTERVAL '14 days',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RLS Policies
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dpo_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dpo_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_signatures" ON public.signatures FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_dpo_contacts" ON public.dpo_contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_dpo_tasks" ON public.dpo_tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "public_read_benchmarks" ON public.market_benchmarks FOR SELECT USING (true);

-- 9. Updated At Triggers
CREATE TRIGGER dpo_contacts_updated_at BEFORE UPDATE ON public.dpo_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER dpo_tasks_updated_at BEFORE UPDATE ON public.dpo_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER signatures_updated_at BEFORE UPDATE ON public.signatures FOR EACH ROW EXECUTE FUNCTION update_updated_at();
