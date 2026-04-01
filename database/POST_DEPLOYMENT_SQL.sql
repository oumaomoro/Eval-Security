-- ============================================================
-- Costloci — Final Master Production SQL Script
-- Run this in your Supabase SQL Editor to initialize the Database.
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Database Schema
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT,
  company_name    TEXT,
  role            TEXT DEFAULT 'analyst' CHECK (role IN ('admin', 'analyst', 'viewer')),
  tier            TEXT DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'pro', 'enterprise')),
  trial_start     TIMESTAMPTZ DEFAULT NOW(),
  trial_end       TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.clients (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name    TEXT NOT NULL,
  industry        TEXT,
  annual_budget   NUMERIC(15,2),
  contact_email   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contracts (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id             UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  vendor_name           TEXT NOT NULL,
  category              TEXT,
  annual_cost           NUMERIC(12,2),
  renewal_date          DATE,
  risk_score            INTEGER CHECK (risk_score BETWEEN 0 AND 100),
  ai_analysis           JSONB DEFAULT '{}',
  file_url              TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.regions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_code      TEXT UNIQUE NOT NULL, -- KE, NG, EG, AE
  custom_ai_prompt  TEXT NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider        TEXT NOT NULL, -- stripe, paypal, paystack
  event_type      TEXT NOT NULL,
  payload         JSONB,
  processed       BOOLEAN DEFAULT FALSE,
  processed_at    TIMESTAMPTZ,
  error           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "user_own_clients" ON public.clients FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_contracts" ON public.contracts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "public_read_regions" ON public.regions FOR SELECT USING (true);
CREATE POLICY "admin_all_webhooks" ON public.webhook_events FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. Trigger for Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, tier)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'free');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Initial Seeding
INSERT INTO public.regions (country_code, custom_ai_prompt) VALUES
('KE', 'Verify compliance against Kenyan Data Protection Act (KDPA) and Central Bank Guidelines.'),
('NG', 'Verify compliance against Nigeria Data Protection Regulation (NDPR).'),
('EG', 'Verify compliance against Egypt Personal Data Protection Law (PDPL).'),
('AE', 'Verify compliance against UAE Federal Data Protection Law.')
ON CONFLICT (country_code) DO NOTHING;

-- 5. Storage Setup (Contract Uploads)
-- Manual Step required in Supabase Dashboard:
-- 1. Create bucket named 'contracts'
-- 2. Set to 'Public' or add storage RLS policies.
-- 3. Add policy for 'Authenticated' users to 'Insert' where 'auth.uid() = user_id'.
