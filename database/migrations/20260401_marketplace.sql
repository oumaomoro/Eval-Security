-- ============================================================
-- Marketplace Migration: Premium Clauses & Monetization
-- ============================================================

-- 1. Marketplace Items (Premium Clauses)
CREATE TABLE IF NOT EXISTS public.marketplace_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  description       TEXT,
  category          TEXT CHECK (category IN ('data_protection','liability','termination','sla','security','audit','confidentiality','other')),
  content           TEXT NOT NULL, -- The clause language itself
  price             NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  currency          TEXT DEFAULT 'USD',
  tags              TEXT[] DEFAULT '{}',
  rating            NUMERIC(3,2) DEFAULT 0.00,
  sales_count       INTEGER DEFAULT 0,
  status            TEXT DEFAULT 'active' CHECK (status IN ('active','delisted','pending')),
  is_verified       BOOLEAN DEFAULT FALSE, -- Verified by Costloci Legal Team
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Marketplace Sales (Transactions)
CREATE TABLE IF NOT EXISTS public.marketplace_sales (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id           UUID REFERENCES public.marketplace_items(id) ON DELETE SET NULL,
  seller_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  buyer_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  total_price       NUMERIC(12,2) NOT NULL,
  platform_fee      NUMERIC(12,2) NOT NULL, -- 30% of total_price
  seller_amount     NUMERIC(12,2) NOT NULL, -- 70% of total_price
  status            TEXT DEFAULT 'completed' CHECK (status IN ('pending','completed','refunded','failed')),
  stripe_payment_id TEXT, -- For tracking external payments
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security (RLS)
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_sales ENABLE ROW LEVEL SECURITY;

-- Anyone can browse active items
CREATE POLICY "Public browse active items" ON public.marketplace_items
  FOR SELECT USING (status = 'active');

-- Sellers can manage their own listings
CREATE POLICY "Sellers manage own listings" ON public.marketplace_items
  FOR ALL USING (auth.uid() = seller_id);

-- Buyers can only see their own purchases
CREATE POLICY "Buyers view own sales" ON public.marketplace_sales
  FOR SELECT USING (auth.uid() = buyer_id);

-- Sellers can only see their own sales
CREATE POLICY "Sellers view own sales" ON public.marketplace_sales
  FOR SELECT USING (auth.uid() = seller_id);

-- 4. Triggers for updated_at
CREATE TRIGGER marketplace_items_updated_at 
  BEFORE UPDATE ON public.marketplace_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. Helper Function: Calculate Split (70/30)
CREATE OR REPLACE FUNCTION calculate_marketplace_split()
RETURNS TRIGGER AS $$
BEGIN
  NEW.platform_fee = NEW.total_price * 0.30;
  NEW.seller_amount = NEW.total_price * 0.70;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER marketplace_sales_calculate_split
  BEFORE INSERT ON public.marketplace_sales
  FOR EACH ROW EXECUTE FUNCTION calculate_marketplace_split();
