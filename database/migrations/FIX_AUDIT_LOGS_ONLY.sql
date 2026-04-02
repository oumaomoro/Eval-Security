-- Costloci Isolated Audit Log Fix
-- Run this if the previous script failed to create audit_logs
-- This uses the standard Supabase uuid-ossp extension for compatibility.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    description TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Enforcement
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only view their own audit logs" ON public.audit_logs;
CREATE POLICY "Users can only view their own audit logs" ON public.audit_logs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Users can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ensure profiles has the necessary columns
DO $$ 
BEGIN
  BEGIN ALTER TABLE public.profiles ADD COLUMN integrations JSONB DEFAULT '{}'; EXCEPTION WHEN duplicate_column THEN END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN region_code VARCHAR(10) DEFAULT 'KE'; EXCEPTION WHEN duplicate_column THEN END;
END $$;
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  event_type VARCHAR(100),
  payload JSONB,
  headers JSONB,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
