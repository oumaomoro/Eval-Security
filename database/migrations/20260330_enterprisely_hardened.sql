-- ============================================================
-- CyberOptimize — Enterprise Hardening & Expansion (Phase 26.5)
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Signatures Table (SignNow Tracking)
CREATE TABLE IF NOT EXISTS public.signatures (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    contract_id             UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
    signnow_document_id     TEXT,
    external_link           TEXT,
    status                  TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'signed', 'expired', 'declined')),
    metadata                JSONB DEFAULT '{}',
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Market Benchmarks (Cost Optimizer Intelligence)
CREATE TABLE IF NOT EXISTS public.market_benchmarks (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category            TEXT NOT NULL, -- e.g. 'firewall', 'endpoint_protection', 'siem'
    avg_annual_cost     NUMERIC(12,2) NOT NULL,
    currency            VARCHAR(5) DEFAULT 'USD',
    region_code         VARCHAR(10) DEFAULT 'GLO', -- 'KE', 'US', 'EU', 'GLO' (Global)
    source              TEXT DEFAULT 'Industry Benchmark 2024',
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DPO Module (Regulatory Compliance Tasks)
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

-- 4. Audit & Billing Improvements
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS template_type TEXT DEFAULT 'executive_summary';
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 5. Expand Regions for Global Compliance
INSERT INTO public.regions (code, name, regulations, reporter_prompt) VALUES
('EU', 'European Union', '["GDPR"]', 'Ensure all processing activities align with GDPR Article 28 (Processor obligations). Identify if standard contractual clauses (SCCs) are present for cross-border transfer.'),
('CA', 'California (USA)', '["CCPA", "CPRA"]', 'Analyze against California Consumer Privacy Act requirements. Focus on "Do Not Sell" provisions and consumer right to delete/opt-out.'),
('EG', 'Egypt', '["PDPL"]', 'Validate against Egypt Law No. 151 of 2020. Focus on the requirement for a local DPO and data localization.'),
('BR', 'Brazil', '["LGPD"]', 'Assess compliance with Lei Geral de Proteção de Dados (LGPD). Highlight rights of data subjects and legal bases for processing.'),
('ZA', 'South Africa', '["POPIA"]', 'Focus on Protection of Personal Information Act (POPIA). Evaluate the 8 conditions for lawful processing and cross-border transfer inside the SADC region.')
ON CONFLICT (code) DO UPDATE SET 
    regulations = EXCLUDED.regulations,
    reporter_prompt = EXCLUDED.reporter_prompt;

-- 6. Seed Market Benchmarks
INSERT INTO public.market_benchmarks (category, avg_annual_cost, region_code) VALUES
('firewall', 25000, 'GLO'),
('endpoint_protection', 15000, 'GLO'),
('siem', 45000, 'GLO'),
('identity_management', 12000, 'GLO'),
('cloud_security', 35000, 'GLO'),
('monitoring', 8000, 'GLO'),
('vulnerability_management', 20000, 'GLO')
ON CONFLICT DO NOTHING;

-- 7. Update Auth Trigger for automated trials
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

-- 8. Enable RLS
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dpo_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_signatures" ON public.signatures FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_dpo_tasks" ON public.dpo_tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "public_read_benchmarks" ON public.market_benchmarks FOR SELECT USING (true);

-- 9. Trigger for Updated At
CREATE TRIGGER dpo_tasks_updated_at BEFORE UPDATE ON public.dpo_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER signatures_updated_at BEFORE UPDATE ON public.signatures FOR EACH ROW EXECUTE FUNCTION update_updated_at();
