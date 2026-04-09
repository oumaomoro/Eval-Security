-- Phase 18: Production Database Bootstrap Migration
-- Run in Supabase SQL Editor or via migration script

-- ─── 1. PRICING TIERS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  monthly_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  included_tokens INTEGER NOT NULL DEFAULT 0,
  overage_price_per_1k_tokens NUMERIC(8,4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 2. CLAUSE LIBRARY ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clause_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clause_name TEXT NOT NULL,
  clause_category TEXT NOT NULL,
  standard_language TEXT NOT NULL,
  jurisdiction TEXT DEFAULT 'universal',
  applicable_standards TEXT[] DEFAULT '{}',
  risk_level_if_missing TEXT DEFAULT 'medium',
  is_mandatory BOOLEAN DEFAULT false,
  generated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 3. MARKETPLACE ITEMS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketplace_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  content TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  sales_count INTEGER DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 4. MARKETPLACE SALES ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketplace_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.marketplace_items(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  commission NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_to_seller NUMERIC(10,2) NOT NULL DEFAULT 0,
  paypal_payout_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 5. INVOICES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  description TEXT,
  pdf_url TEXT,
  paypal_invoice_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 6. BACKGROUND JOBS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.background_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  payload JSONB DEFAULT '{}',
  result JSONB DEFAULT '{}',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 7. USAGE LOGS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID,
  model TEXT NOT NULL,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  operation TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 8. CONTRACT OVERAGES ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contract_overages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID,
  overage_month DATE NOT NULL,
  price_per_contract NUMERIC(8,2) DEFAULT 10,
  billed BOOLEAN DEFAULT false,
  billed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 9. ALERTS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 10. EMAIL QUEUE ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "to" TEXT NOT NULL,
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  next_attempt TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 11. ONBOARDING EMAILS SENT ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.onboarding_emails_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  milestone TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, milestone)
);

-- ─── 12. RISK REGISTER (ensure org scope) ────────────────────────────────────
ALTER TABLE IF EXISTS public.risk_register 
  ADD COLUMN IF NOT EXISTS organization_id UUID;

-- ─── 13. REPORTS (ensure org scope) ─────────────────────────────────────────
ALTER TABLE IF EXISTS public.reports 
  ADD COLUMN IF NOT EXISTS organization_id UUID;

-- ─── 14. PROFILES (ensure PayPal columns) ────────────────────────────────────
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS paypal_email TEXT,
  ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS billing_provider TEXT DEFAULT 'paypal',
  ADD COLUMN IF NOT EXISTS is_seller BOOLEAN DEFAULT false;

-- ─── 15. INCREMENT SALES COUNT FUNCTION ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_sales_count(item_uid UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.marketplace_items
  SET sales_count = COALESCE(sales_count, 0) + 1
  WHERE id = item_uid;
END;
$$;

-- ─── Enable RLS (Row Level Security) ─────────────────────────────────────────
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clause_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.background_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_overages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_emails_sent ENABLE ROW LEVEL SECURITY;

-- Public read on pricing_tiers and clause_library
CREATE POLICY IF NOT EXISTS "Public read pricing_tiers" ON public.pricing_tiers FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public read clause_library" ON public.clause_library FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Authenticated insert clause_library" ON public.clause_library FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "Public read marketplace_items" ON public.marketplace_items FOR SELECT USING (status = 'active');
CREATE POLICY IF NOT EXISTS "Seller manage items" ON public.marketplace_items FOR ALL USING (auth.uid() = seller_id);
CREATE POLICY IF NOT EXISTS "Users see own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users see own jobs" ON public.background_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users see own usage" ON public.usage_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Service role full access" ON public.usage_logs FOR ALL USING (true);
