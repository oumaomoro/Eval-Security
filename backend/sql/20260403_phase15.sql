-- Phase 15: Advanced Billing & Monetization
-- This migration establishes the foundation for marketplace payouts, overage billing, and invoices.

-- 1. Seller columns in profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_seller BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS paypal_merchant_id TEXT;

-- 2. Pricing tiers (Monetize at Scale)
CREATE TABLE IF NOT EXISTS pricing_tiers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  base_price NUMERIC NOT NULL,
  included_tokens INTEGER DEFAULT 100000, -- 100k tokens included
  overage_price_per_1k_tokens NUMERIC DEFAULT 0.02, -- $0.02 per 1k tokens
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default tiers
INSERT INTO pricing_tiers (name, base_price, included_tokens, overage_price_per_1k_tokens)
VALUES 
  ('Starter', 149, 100000, 0.05),
  ('Professional', 399, 500000, 0.03),
  ('Enterprise', 999, 2000000, 0.02)
ON CONFLICT (name) DO NOTHING;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pricing_tier_id UUID REFERENCES pricing_tiers(id);

-- 3. Usage events (Advanced Tracking)
-- Note: 'usage_logs' already exists from Phase 14, we will use it for overage billing.
-- We add a 'billed' flag to handle monthly settlement.
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS billed BOOLEAN DEFAULT false;
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS settlement_id UUID;

-- 4. Invoices (Professional Billing)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'unpaid', -- unpaid, paid, void
  pdf_url TEXT,
  stripe_invoice_id TEXT,
  billing_month TEXT, -- e.g., '2026-04'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Marketplace Sales (Revenue Split)
CREATE TABLE IF NOT EXISTS marketplace_sales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seller_id UUID REFERENCES auth.users(id),
  buyer_id UUID REFERENCES auth.users(id),
  item_id UUID REFERENCES marketplace_items(id), -- assumed marketplace_items table from Phase 12
  amount NUMERIC NOT NULL,
  commission NUMERIC NOT NULL, -- Platform 30%
  net_to_seller NUMERIC NOT NULL, -- Seller 70%
  stripe_transfer_id TEXT,
  status TEXT DEFAULT 'pending', -- pending, transferred, failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_seller ON marketplace_sales(seller_id);
CREATE INDEX IF NOT EXISTS idx_usage_billed ON usage_logs(billed) WHERE billed = false;
