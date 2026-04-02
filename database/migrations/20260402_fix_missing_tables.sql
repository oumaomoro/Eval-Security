-- Fix for missing tables identified during production hardening
-- Date: 2026-04-02

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

-- RLS for Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- 2. Contract Overages Table
CREATE TABLE IF NOT EXISTS public.contract_overages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
    overage_month TEXT NOT NULL, -- YYYY-MM
    price_per_contract NUMERIC(10,2) DEFAULT 10.00,
    paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Overages
ALTER TABLE public.contract_overages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own overages" ON public.contract_overages
    FOR SELECT USING (auth.uid() = user_id);

-- 3. Ensure alerts table has correct columns (consistency check)
-- notifications.routes.js uses 'notifications' table, but dashboard metrics might use 'alerts'
-- We'll keep both for now but ensure 'notifications' is the primary for the UI bell.
