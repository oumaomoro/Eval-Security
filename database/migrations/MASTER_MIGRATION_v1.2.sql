-- =============================================================
-- Costloci v1.2 — Master Production Migration
-- Run this once in the Supabase SQL Editor.
-- Safe to re-run: all statements use IF NOT EXISTS / IF EXISTS.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- PART 1: Performance Indexes
-- ─────────────────────────────────────────────────────────────

-- Contracts: user dashboard + renewal tracking
CREATE INDEX IF NOT EXISTS idx_contracts_user_id       ON public.contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_renewal_date  ON public.contracts(renewal_date);

-- Clients: customer relationship lookups
CREATE INDEX IF NOT EXISTS idx_clients_user_id         ON public.clients(user_id);

-- Overage billing: monthly aggregation
CREATE INDEX IF NOT EXISTS idx_contract_overages_user_id ON public.contract_overages(user_id);

-- Profiles: Stripe webhook fulfillment + onboarding drip
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at         ON public.profiles(created_at);


-- ─────────────────────────────────────────────────────────────
-- PART 2: API Key Security (bcrypt transition)
-- ─────────────────────────────────────────────────────────────

-- Flag to distinguish hashed vs legacy plaintext keys
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS api_key_hashed BOOLEAN DEFAULT FALSE;

-- Ensure the column is wide enough for a 60-char bcrypt hash
ALTER TABLE public.profiles
  ALTER COLUMN api_key TYPE TEXT;


-- ─────────────────────────────────────────────────────────────
-- PART 3: Onboarding Drip Campaign Tracking
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.onboarding_emails_sent (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  milestone   TEXT        NOT NULL,  -- 'day_1' | 'day_3' | 'day_7' | 'day_12'
  sent_at     TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, milestone)
);

ALTER TABLE public.onboarding_emails_sent ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only — onboarding" ON public.onboarding_emails_sent;
CREATE POLICY "Service role only — onboarding"
  ON public.onboarding_emails_sent
  USING (auth.jwt() ->> 'role' = 'service_role');


-- ─────────────────────────────────────────────────────────────
-- PART 4: Background Job Queue
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.background_jobs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_type    TEXT        NOT NULL,  -- e.g. 'strategic_pack_generation'
  status      TEXT        NOT NULL
              CHECK (status IN ('queued','processing','completed','failed'))
              DEFAULT 'queued',
  payload     JSONB,
  result      JSONB,
  error       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_background_jobs_user_status
  ON public.background_jobs(user_id, status);

ALTER TABLE public.background_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own jobs" ON public.background_jobs;
CREATE POLICY "Users see own jobs"
  ON public.background_jobs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access — jobs" ON public.background_jobs;
CREATE POLICY "Service role full access — jobs"
  ON public.background_jobs
  USING (auth.jwt() ->> 'role' = 'service_role');


-- ─────────────────────────────────────────────────────────────
-- PART 5: Webhook Events Audit Log (ensure column coverage)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.webhook_events
  ADD COLUMN IF NOT EXISTS processed    BOOLEAN     DEFAULT FALSE;
ALTER TABLE public.webhook_events
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
ALTER TABLE public.webhook_events
  ADD COLUMN IF NOT EXISTS error        TEXT;


-- ─────────────────────────────────────────────────────────────
-- DONE — Costloci v1.2 migration complete ✅
-- =============================================================
