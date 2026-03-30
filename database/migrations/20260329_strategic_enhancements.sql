-- Migration: Strategic Revenue & Operational Enhancements
-- 2026-03-29

-- 1. Feature 2: Usage-Based Overage Billing
CREATE TABLE IF NOT EXISTS public.contract_overages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  contract_id UUID REFERENCES public.contracts(id) NOT NULL,
  overage_month DATE NOT NULL,
  price_per_contract NUMERIC DEFAULT 10.00,
  billed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.contract_overages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_overages" ON public.contract_overages FOR ALL USING (auth.uid() = user_id);


-- 2. Feature 3: API Access Tier
DO $$ 
BEGIN
  BEGIN
    ALTER TABLE public.profiles ADD COLUMN api_access BOOLEAN DEFAULT false;
  EXCEPTION WHEN duplicate_column THEN END;
  BEGIN
    ALTER TABLE public.profiles ADD COLUMN api_key TEXT UNIQUE;
  EXCEPTION WHEN duplicate_column THEN END;
END $$;

UPDATE public.profiles SET api_key = encode(gen_random_bytes(32), 'hex') WHERE api_access = true AND api_key IS NULL;


-- 3. Feature 4: Compliance Report Export Fee
CREATE TABLE IF NOT EXISTS public.export_charges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.export_charges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_export_charges" ON public.export_charges FOR ALL USING (auth.uid() = user_id);


-- 4. Feature 5: Email Renewal Alerts
DO $$ 
BEGIN
  BEGIN
    ALTER TABLE public.contracts ADD COLUMN last_renewal_alert_sent TIMESTAMP WITH TIME ZONE;
  EXCEPTION WHEN duplicate_column THEN END;
END $$;


-- 5. Feature 8: Founding Partner Program
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_email TEXT,
  discount_percent INT DEFAULT 50,
  start_date DATE,
  end_date DATE,
  case_study_approved BOOLEAN DEFAULT false,
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
-- Admin can perform all operations, others none by default.
CREATE POLICY "Admin All Partners" ON public.partners FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
