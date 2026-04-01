-- ============================================================
-- Costloci — Full Database Schema
-- Run this in your Supabase SQL Editor (Project: ulercnwyckrcjcnrenzz)
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USERS / PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT,
  company_name    TEXT,
  role            TEXT DEFAULT 'analyst' CHECK (role IN ('admin', 'analyst', 'viewer')),
  plan            TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'professional', 'enterprise')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. CONTRACTS (Core entity)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contracts (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_name           TEXT NOT NULL,
  product_service       TEXT,
  category              TEXT CHECK (category IN ('endpoint_protection','network_security','cloud_security','siem','identity_management','vulnerability_management','monitoring','other')),
  annual_cost           NUMERIC(12,2),
  monthly_cost          NUMERIC(12,2),
  contract_start_date   DATE,
  renewal_date          DATE,
  contract_term_months  INTEGER,
  license_count         INTEGER,
  auto_renewal          BOOLEAN DEFAULT FALSE,
  payment_frequency     TEXT CHECK (payment_frequency IN ('monthly','quarterly','annual')),
  file_url              TEXT,
  status                TEXT DEFAULT 'active' CHECK (status IN ('active','expired','pending','cancelled')),
  risk_score            INTEGER CHECK (risk_score BETWEEN 0 AND 100),
  compliance_score      INTEGER CHECK (compliance_score BETWEEN 0 AND 100),
  ai_analysis           JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. COMPLIANCE AUDITS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.compliance_audits (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  audit_name                TEXT NOT NULL,
  audit_type                TEXT DEFAULT 'automated' CHECK (audit_type IN ('manual','automated','scheduled')),
  status                    TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','failed')),
  standards                 TEXT[] DEFAULT '{}',
  overall_compliance_score  INTEGER CHECK (overall_compliance_score BETWEEN 0 AND 100),
  findings                  JSONB DEFAULT '[]',
  compliance_by_standard    JSONB DEFAULT '{}',
  executive_summary         TEXT,
  remediation_tasks_created INTEGER DEFAULT 0,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  completed_at              TIMESTAMPTZ
);

-- ============================================================
-- 4. REMEDIATION TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.remediation_tasks (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  audit_id          UUID REFERENCES public.compliance_audits(id) ON DELETE SET NULL,
  contract_id       UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  description       TEXT NOT NULL,
  severity          TEXT CHECK (severity IN ('critical','high','medium','low')),
  status            TEXT DEFAULT 'todo' CHECK (status IN ('todo','in_progress','completed','accepted')),
  due_date          DATE,
  assigned_to       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. RISK REGISTER
-- ============================================================
CREATE TABLE IF NOT EXISTS public.risk_register (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_id         UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  risk_title          TEXT NOT NULL,
  risk_category       TEXT CHECK (risk_category IN ('compliance','financial','operational','security','strategic','reputational')),
  risk_description    TEXT,
  severity            TEXT CHECK (severity IN ('critical','high','medium','low')),
  likelihood          TEXT CHECK (likelihood IN ('very_high','high','medium','low','very_low')),
  impact              TEXT CHECK (impact IN ('very_high','high','medium','low','very_low')),
  risk_score          INTEGER CHECK (risk_score BETWEEN 0 AND 100),
  mitigation_status   TEXT DEFAULT 'identified' CHECK (mitigation_status IN ('identified','mitigation_planned','in_progress','mitigated','accepted')),
  mitigation_notes    TEXT,
  financial_exposure  JSONB DEFAULT '{"min_estimate":0,"max_estimate":0}',
  ai_confidence       INTEGER CHECK (ai_confidence BETWEEN 0 AND 100),
  auto_generated      BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. CLAUSE LIBRARY
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clause_library (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clause_name             TEXT NOT NULL,
  clause_category         TEXT CHECK (clause_category IN ('data_protection','liability','termination','sla','security','audit','confidentiality','other')),
  standard_language       TEXT NOT NULL,
  jurisdiction            TEXT DEFAULT 'universal' CHECK (jurisdiction IN ('kenya','east_africa','international','universal')),
  applicable_standards    TEXT[] DEFAULT '{}',
  risk_level_if_missing   TEXT CHECK (risk_level_if_missing IN ('critical','high','medium','low')),
  is_mandatory            BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. SAVINGS OPPORTUNITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.savings_opportunities (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_id       UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  opportunity_type  TEXT CHECK (opportunity_type IN ('license_right_sizing','vendor_consolidation','pricing_above_market','payment_term_optimization','redundant_tool')),
  vendor_name       TEXT,
  description       TEXT,
  potential_savings NUMERIC(12,2),
  confidence        INTEGER CHECK (confidence BETWEEN 0 AND 100),
  effort            TEXT CHECK (effort IN ('low','medium','high')),
  status            TEXT DEFAULT 'identified' CHECK (status IN ('identified','under_review','approved','implemented','dismissed')),
  category          TEXT,
  action_required   TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  report_name   TEXT NOT NULL,
  report_type   TEXT,
  status        TEXT DEFAULT 'generating' CHECK (status IN ('generating','completed','failed','scheduled')),
  scope         JSONB DEFAULT '{}',
  file_url      TEXT,
  pages         INTEGER,
  generated_by  TEXT DEFAULT 'AI Engine v2.1',
  scheduled_for TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

-- ============================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_audits   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remediation_tasks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_register       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clause_library      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports             ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "user_own_data" ON public.contracts           FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_data" ON public.compliance_audits   FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_data" ON public.remediation_tasks   FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_data" ON public.risk_register       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_data" ON public.savings_opportunities FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_data" ON public.reports             FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_profile" ON public.profiles         FOR ALL USING (auth.uid() = id);

-- Clause library is readable by all authenticated users
CREATE POLICY "read_clause_library" ON public.clause_library FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- 10. AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contracts_updated_at           BEFORE UPDATE ON public.contracts           FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER remediation_updated_at         BEFORE UPDATE ON public.remediation_tasks   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER risk_updated_at                BEFORE UPDATE ON public.risk_register       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER savings_updated_at             BEFORE UPDATE ON public.savings_opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 11. SEED CLAUSE LIBRARY (Standard clauses)
-- ============================================================
INSERT INTO public.clause_library (clause_name, clause_category, standard_language, jurisdiction, applicable_standards, risk_level_if_missing, is_mandatory) VALUES
('Data Deletion & Retention', 'data_protection', 'Upon termination or written request, Vendor shall delete all Customer Personal Data within 30 days and provide written certification of deletion. Vendor shall maintain audit logs of all deletion activities for a minimum of 24 months.', 'kenya', ARRAY['KDPA','GDPR'], 'critical', TRUE),
('Liability Cap (Cybersecurity)', 'liability', 'Vendor''s total aggregate liability for any security incident or data breach shall not be limited to less than three (3) times the total annual fees paid by Customer in the twelve (12) months preceding the incident.', 'international', ARRAY['ISO27001'], 'high', TRUE),
('Security Incident Notification', 'sla', 'Vendor shall notify Customer of any security incident or suspected breach within 72 hours of discovery. Notification shall include: nature of incident, data categories affected, estimated number of records, and remediation steps taken.', 'international', ARRAY['GDPR','KDPA','CBK'], 'critical', TRUE),
('Right to Audit', 'data_protection', 'Customer reserves the right to conduct or commission an independent security audit of Vendor''s systems, controls, and practices annually, or at any time following a security incident. Vendor shall cooperate fully and provide access within 10 business days.', 'kenya', ARRAY['CBK','KDPA'], 'high', FALSE),
('SLA & Uptime Guarantee', 'sla', 'Vendor guarantees 99.9% monthly uptime. For each hour of downtime exceeding the SLA, Customer shall receive a service credit of 5% of the monthly fee, up to a maximum of 30% per month.', 'universal', ARRAY['ISO27001'], 'medium', FALSE),
('Data Residency', 'data_protection', 'All Customer Data shall be stored and processed exclusively within the Republic of Kenya, unless Customer provides explicit prior written consent for cross-border transfers. Any approved transfer must comply with KDPA Third Schedule requirements.', 'kenya', ARRAY['KDPA'], 'critical', TRUE),
('Termination for Convenience', 'termination', 'Either party may terminate this Agreement without cause upon 30 days written notice. Upon termination, Vendor shall provide an exit plan including data portability in standard formats within 15 business days.', 'universal', ARRAY[]::TEXT[], 'medium', FALSE),
('Regulatory Notification (IRA)', 'compliance', 'Vendor must immediately notify the Insurance Regulatory Authority of Kenya (IRA) in the event of any material disruption to the services that impacts the Customer''s ability to serve policyholders or maintain regulatory reporting.', 'kenya', ARRAY['IRA'], 'critical', TRUE),
('Sub-contractor Approval (CMA)', 'compliance', 'Pursuant to Capital Markets Authority (CMA) guidelines, Vendor shall not subcontract any material portion of the services, especially those involving financial data processing, without prior written approval from the Customer.', 'east_africa', ARRAY['CMA'], 'high', TRUE),
('HIPAA Business Associate Agreement', 'data_protection', 'Where the Vendor processes Protected Health Information (PHI), the Vendor agrees to be bound by the terms of the attached Business Associate Agreement (BAA) in compliance with HIPAA requirements.', 'international', ARRAY['HIPAA'], 'critical', TRUE),
('SADC Data Sovereignity (POPIA)', 'data_protection', 'Vendor shall not transfer Customer Data outside of the Republic of South Africa or the Southern African Development Community (SADC) region without prior written approval. All processing must comply with POPIA requirements.', 'international', ARRAY['POPIA','SADC'], 'critical', TRUE),
('CBK Outsourcing Notification', 'compliance', 'Pursuant to Central Bank of Kenya (CBK) Outsourcing Guidelines 2024, Vendor shall immediately notify the Customer and the CBK of any material security breach affecting the critical systems provided hereunder.', 'kenya', ARRAY['CBK'], 'high', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 12. MIGRATIONS & UPDATES
-- ============================================================

-- Added for Phase 9: Third-Party Integrations Storage (OAuth Tokens)
BEGIN;
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns 
      WHERE table_name='profiles' AND column_name='integrations'
    ) THEN
      ALTER TABLE public.profiles ADD COLUMN integrations JSONB DEFAULT '{}'::jsonb;
    END IF;
  END $$;
COMMIT;

-- Phase 11.2: Caching for Dynamic DPO Regulatory Heatmap Matrices
BEGIN;
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns 
      WHERE table_name='contracts' AND column_name='regulatory_matrices'
    ) THEN
      ALTER TABLE public.contracts ADD COLUMN regulatory_matrices JSONB DEFAULT '{}'::jsonb;
    END IF;
  END $$;
COMMIT;

-- Phase 11.3: Immutable Audit Logging (Chain of Custody SOC 2 Readiness)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    description TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS logic for Audit Logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only view their own audit logs" ON public.audit_logs;
CREATE POLICY "Users can only view their own audit logs" ON public.audit_logs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Users can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Phase 21: Clause Caching for ROI Optimization
CREATE TABLE IF NOT EXISTS public.clause_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clause_hash TEXT NOT NULL UNIQUE,
    framework_context TEXT NOT NULL, -- e.g. "IRA_Kenya", "POPIA_SA"
    analysis_json JSONB NOT NULL,
    times_served INTEGER DEFAULT 1,
    last_hit TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cache is globally readable but only system-writable
CREATE POLICY "Public Read Cache" ON public.clause_cache FOR SELECT USING (true);


-- ============================================================
-- 13. PHASE 24: POST-LAUNCH ENHANCEMENTS (MONETIZATION & OPS)
-- ============================================================

-- Regions for dynamic compliance
CREATE TABLE IF NOT EXISTS public.regions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,          -- 'KE', 'NG', 'EG', 'AE'
  name VARCHAR(100) NOT NULL,
  regulations JSONB NOT NULL,                 -- e.g., ['KDPA', 'NDPR', 'CBK']
  clauses JSONB,                              -- array of standard clause texts
  reporter_prompt TEXT,                       -- custom prompt for report generation
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook events logging
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,              -- 'stripe', 'paypal'
  event_type VARCHAR(100),
  payload JSONB,
  headers JSONB,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User feedback
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  message TEXT NOT NULL,
  page_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System alerts (e.g., OpenAI spending threshold)
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type VARCHAR(50) NOT NULL,                  -- 'openai_usage', 'webhook_failure', etc.
  message TEXT NOT NULL,
  metadata JSONB,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modify profiles Table for Trials and Regions
DO $$ 
BEGIN
  BEGIN
    ALTER TABLE public.profiles ADD COLUMN region_code VARCHAR(10) DEFAULT 'KE';
  EXCEPTION WHEN duplicate_column THEN END;
  
  BEGIN
    ALTER TABLE public.profiles ADD COLUMN trial_start TIMESTAMP WITH TIME ZONE;
  EXCEPTION WHEN duplicate_column THEN END;
  
  BEGIN
    ALTER TABLE public.profiles ADD COLUMN trial_end TIMESTAMP WITH TIME ZONE;
  EXCEPTION WHEN duplicate_column THEN END;
  
  BEGIN
    ALTER TABLE public.profiles ADD COLUMN trial_used BOOLEAN DEFAULT false;
  EXCEPTION WHEN duplicate_column THEN END;
END $$;

-- RLS Policies for new tables
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin All Webhooks" ON public.webhook_events FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admin All Alerts" ON public.alerts FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Public Read Regions" ON public.regions FOR SELECT USING (true);
CREATE POLICY "Users insert own feedback" ON public.feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own feedback" ON public.feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin read all feedback" ON public.feedback FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Update the Auth Trigger to set trial dates on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, plan, trial_start, trial_end)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    'analyst',
    'starter',
    NOW(),
    NOW() + INTERVAL '14 days'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger (drop old first)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed Regional Data
INSERT INTO public.regions (code, name, regulations, reporter_prompt) VALUES
('KE', 'Kenya', '["KDPA", "CBK"]', 'Focus on compliance with Kenyan Data Protection Act (KDPA) and Central Bank of Kenya guidelines. Ensure vendor liability caps align with Kenyan regulatory risk standards.'),
('NG', 'Nigeria', '["NDPR"]', 'Emphasize Nigeria Data Protection Regulation (NDPR) requirements. Focus on data localization inside Nigeria for sensitive processing.'),
('EG', 'Egypt', '["PDPL"]', 'Analyze against Egypt Personal Data Protection Law (PDPL). Ensure strict sovereign boundaries for data transfer out of Egypt.'),
('AE', 'UAE', '["UAE Data Law"]', 'Assess alignment with UAE Data Protection Law and DIFC/ADGM frameworks if applicable. Highlight cross-border data transfer mechanisms.')
ON CONFLICT (code) DO NOTHING;
