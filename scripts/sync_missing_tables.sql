-- ============================================================
-- COSTLOCI MASTER SCHEMA SYNC: TRACK 1
-- Aligns DB with shared/schema.ts and ULTIMATE PROMPT
-- ============================================================

-- 1. Clauses Table
CREATE TABLE IF NOT EXISTS public.clauses (
  id           BIGSERIAL PRIMARY KEY,
  workspace_id BIGINT REFERENCES public.workspaces(id) ON DELETE CASCADE,
  contract_id  BIGINT REFERENCES public.contracts(id) ON DELETE CASCADE,
  title        TEXT,
  content      TEXT NOT NULL,
  risk_level   TEXT NOT NULL DEFAULT 'low',
  category     TEXT NOT NULL,
  is_standard  BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Playbooks (Join Table)
CREATE TABLE IF NOT EXISTS public.user_playbooks (
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  playbook_id  BIGINT REFERENCES public.playbooks(id) ON DELETE CASCADE,
  assigned_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, playbook_id)
);

-- 3. Insurance Policies
CREATE TABLE IF NOT EXISTS public.insurance_policies (
  id              BIGSERIAL PRIMARY KEY,
  workspace_id    BIGINT REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_id       BIGINT REFERENCES public.contracts(id) ON DELETE CASCADE,
  carrier_name    TEXT NOT NULL,
  policy_number   TEXT NOT NULL,
  coverage_limits JSONB, -- { perOccurrence, ransomwareSubLimit, etc. }
  premium_amount  NUMERIC DEFAULT 0,
  effective_date  DATE,
  expiration_date DATE,
  file_url        TEXT,
  status          TEXT DEFAULT 'active', -- active, expired, reviewing
  claim_risk_score INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Subscriptions Hardening
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                     BIGSERIAL PRIMARY KEY,
  workspace_id           BIGINT REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id                UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  paypal_subscription_id TEXT UNIQUE,
  paystack_subscription_id TEXT UNIQUE,
  tier                   TEXT NOT NULL DEFAULT 'starter', -- starter, pro, enterprise
  status                 TEXT NOT NULL DEFAULT 'active',
  current_period_end     TIMESTAMPTZ,
  overage_billed         BOOLEAN DEFAULT false,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Usage Events (For Overage Billing)
CREATE TABLE IF NOT EXISTS public.usage_events (
  id           BIGSERIAL PRIMARY KEY,
  workspace_id BIGINT REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id),
  event_type   TEXT NOT NULL, -- ai_analysis, strategic_pack, marketplace_purchase
  metadata     JSONB,
  credits_used INTEGER DEFAULT 1,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to 'contracts' if necessary (remediation_status, etc.)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='remediation_status') THEN
        ALTER TABLE public.contracts ADD COLUMN remediation_status TEXT DEFAULT 'none';
        ALTER TABLE public.contracts ADD COLUMN remediation_addendum TEXT;
    END IF;
END $$;

SELECT 'Track 1: Schema Sync Complete' as status;
