-- Production Performance Indexes (2026-03-31)
-- Targets: Frequent filtering and foreign key lookups

-- Contracts Table: Optimize for user dashboard and renewal tracking
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON public.contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_renewal_date ON public.contracts(renewal_date);

-- Clients Table: Optimize for customer relationship lookups
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);

-- Overage Tracking: Optimize for monthly billing logic
CREATE INDEX IF NOT EXISTS idx_contract_overages_user_id ON public.contract_overages(user_id);

-- Profiles Table: Optimize for Stripe webhook lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);

-- Onboarding Drip: Optimize for signup date milestones
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);
