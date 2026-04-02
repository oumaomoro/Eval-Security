-- Costloci Final Production Schema Remediation
-- Date: 2026-04-02
-- This script ensures all tables required for full platform functionality are created.

-- 1. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'compliance', 'system', 'billing'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only view their own notifications" ON public.notifications;
CREATE POLICY "Users can only view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

-- 2. Audit Logs
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
DROP POLICY IF EXISTS "Users can only view their own audit logs" ON public.audit_logs;
CREATE POLICY "Users can only view their own audit logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Users can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Webhook Events
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  event_type VARCHAR(100),
  payload JSONB,
  headers JSONB,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Contract Overages
CREATE TABLE IF NOT EXISTS public.contract_overages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
    overage_month TEXT NOT NULL,
    price_per_contract NUMERIC(10,2) DEFAULT 10.00,
    paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.contract_overages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see their own overages" ON public.contract_overages;
CREATE POLICY "Users can see their own overages" ON public.contract_overages FOR SELECT USING (auth.uid() = user_id);

-- 5. Alerts & Feedback
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  message TEXT NOT NULL,
  page_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Column Hardening (Profiles)
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
  
  BEGIN
    ALTER TABLE public.profiles ADD COLUMN upgraded_at TIMESTAMP WITH TIME ZONE;
  EXCEPTION WHEN duplicate_column THEN END;
  BEGIN
    ALTER TABLE public.profiles ADD COLUMN integrations JSONB DEFAULT '{}';
  EXCEPTION WHEN duplicate_column THEN END;
END $$;

-- 7. Cost Optimization & Benchmarking
CREATE TABLE IF NOT EXISTS public.market_benchmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL UNIQUE,
    avg_annual_cost NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ 
BEGIN
  BEGIN ALTER TABLE public.market_benchmarks ADD COLUMN market_low NUMERIC(12,2); EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.market_benchmarks ADD COLUMN market_high NUMERIC(12,2); EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.market_benchmarks ADD COLUMN peers_count INTEGER DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;
END $$;

CREATE TABLE IF NOT EXISTS public.savings_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(contract_id, category)
);

DO $$ 
BEGIN
  BEGIN ALTER TABLE public.savings_opportunities ADD COLUMN opportunity_type TEXT; EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.savings_opportunities ADD COLUMN vendor_name TEXT; EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.savings_opportunities ADD COLUMN description TEXT; EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.savings_opportunities ADD COLUMN current_cost NUMERIC(12,2); EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.savings_opportunities ADD COLUMN benchmark_cost NUMERIC(12,2); EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.savings_opportunities ADD COLUMN potential_savings NUMERIC(12,2); EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.savings_opportunities ADD COLUMN confidence INTEGER DEFAULT 80; EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.savings_opportunities ADD COLUMN effort TEXT DEFAULT 'medium'; EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.savings_opportunities ADD COLUMN status TEXT DEFAULT 'identified'; EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.savings_opportunities ADD COLUMN action_required TEXT; EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.savings_opportunities ADD COLUMN recommendation TEXT; EXCEPTION WHEN duplicate_column THEN END;
END $$;

ALTER TABLE public.market_benchmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read benchmarks" ON public.market_benchmarks;
CREATE POLICY "Public read benchmarks" ON public.market_benchmarks FOR SELECT USING (true);

ALTER TABLE public.savings_opportunities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see own opportunities" ON public.savings_opportunities;
CREATE POLICY "Users can see own opportunities" ON public.savings_opportunities FOR SELECT USING (auth.uid() = user_id);

-- 8. Seed Initial Benchmarks
INSERT INTO public.market_benchmarks (category, avg_annual_cost, market_low, market_high, peers_count) VALUES
('edr', 155.00, 120.00, 220.00, 45),
('siem', 85000.00, 60000.00, 150000.00, 18),
('firewall', 12000.00, 8000.00, 25000.00, 32),
('cloud_security', 45000.00, 30000.00, 90000.00, 27),
('monitoring', 70.00, 55.00, 95.00, 31)
ON CONFLICT (category) DO UPDATE SET 
  avg_annual_cost = EXCLUDED.avg_annual_cost,
  market_low = EXCLUDED.market_low,
  market_high = EXCLUDED.market_high,
  peers_count = EXCLUDED.peers_count;
