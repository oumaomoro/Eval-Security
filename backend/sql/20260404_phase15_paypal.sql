-- Phase 15: Advanced Billing & Monetization (PayPal Edition)
-- This migration establishing the foundation for PayPal Seller Payouts and Usage-based Invoicing.

-- 1. PayPal Seller Columns in profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_seller BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS paypal_email TEXT; -- Primary payout address for sellers

-- 2. Marketplace Sales (Auditing for PayPal split)
-- This table tracks the full amount, platform commission (30%), and the net to the seller (70%)
CREATE TABLE IF NOT EXISTS marketplace_sales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seller_id UUID REFERENCES auth.users(id),
  buyer_id UUID REFERENCES auth.users(id),
  item_id UUID REFERENCES marketplace_items(id), -- assumed marketplace_items table from Phase 12
  amount NUMERIC NOT NULL,
  commission NUMERIC NOT NULL, -- Platform 30%
  net_to_seller NUMERIC NOT NULL, -- Seller 70%
  paypal_payout_id TEXT, -- The reference for the PayPal Payout generated
  status TEXT DEFAULT 'pending', -- pending, transferred, failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Usage-based Overage Billing (Audit logs for PayPal Invoicing)
CREATE TABLE IF NOT EXISTS usage_invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  tokens_overage INTEGER NOT NULL,
  amount_due NUMERIC NOT NULL,
  paypal_invoice_id TEXT,
  status TEXT DEFAULT 'draft', -- draft, sent, paid
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_payout_status ON marketplace_sales(status);
CREATE INDEX IF NOT EXISTS idx_usage_invoice_org ON usage_invoices(organization_id);
