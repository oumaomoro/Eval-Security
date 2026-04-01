-- ============================================================
-- Costloci — SaaS Subscriptions Update
-- Migration for tracking subscription IDs from Stripe & PayPal
-- Run this in your Supabase SQL Editor
-- ============================================================

DO $$ 
BEGIN
  BEGIN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT;
  EXCEPTION WHEN duplicate_column THEN END;

  BEGIN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS billing_provider TEXT DEFAULT 'none' CHECK (billing_provider IN ('stripe', 'paypal', 'paystack', 'none'));
  EXCEPTION WHEN duplicate_column THEN END;
END $$;
