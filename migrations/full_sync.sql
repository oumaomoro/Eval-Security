-- =========================================================
-- CyberOptimize Full Schema Sync Migration v2
-- Generated: 2026-04-17 (Fixed UUID type for user references)
-- Apply this in: Supabase Dashboard > SQL Editor
-- This migration is IDEMPOTENT (safe to re-run)
-- =========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================
-- ENUMS
-- =========================================================
DO $$ BEGIN
    CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'editor', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================================
-- PROFILES TABLE (Supabase auth mirror)
-- =========================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE,
    first_name VARCHAR,
    last_name VARCHAR,
    client_id INTEGER,
    role VARCHAR DEFAULT 'analyst',
    profile_image_url VARCHAR,
    webauthn_id VARCHAR,
    webauthn_credential TEXT,
    mfa_enabled BOOLEAN DEFAULT false,
    subscription_tier VARCHAR DEFAULT 'starter',
    contracts_count INTEGER DEFAULT 0,
    api_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- SESSIONS TABLE (Replit Auth - required)
-- =========================================================
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions(expire);

-- =========================================================
-- CORE TABLES
-- =========================================================

-- Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id UUID REFERENCES profiles(id),
    plan TEXT NOT NULL DEFAULT 'enterprise',
    webhook_url TEXT,
    webhook_enabled BOOLEAN DEFAULT false,
    api_usage_count INTEGER DEFAULT 0,
    api_usage_reset_date TIMESTAMPTZ,
    active_standards JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace Members
CREATE TABLE IF NOT EXISTS workspace_members (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    role workspace_role NOT NULL DEFAULT 'viewer',
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id),
    company_name TEXT NOT NULL,
    industry TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    annual_budget DOUBLE PRECISION,
    status TEXT NOT NULL DEFAULT 'active',
    risk_threshold INTEGER DEFAULT 70,
    compliance_focus TEXT DEFAULT 'KDPA',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contracts
CREATE TABLE IF NOT EXISTS contracts (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id),
    client_id INTEGER NOT NULL REFERENCES clients(id),
    vendor_name TEXT NOT NULL,
    product_service TEXT NOT NULL,
    category TEXT NOT NULL,
    annual_cost DOUBLE PRECISION,
    monthly_cost DOUBLE PRECISION,
    contract_start_date DATE,
    renewal_date DATE,
    contract_term_months INTEGER,
    license_count INTEGER,
    auto_renewal BOOLEAN DEFAULT false,
    payment_frequency TEXT,
    file_url TEXT,
    status TEXT DEFAULT 'active',
    ai_analysis JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insurance Policies
CREATE TABLE IF NOT EXISTS insurance_policies (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id),
    client_id INTEGER NOT NULL REFERENCES clients(id),
    carrier_name TEXT NOT NULL,
    policy_number TEXT NOT NULL,
    premium_amount DOUBLE PRECISION,
    effective_date DATE,
    expiration_date DATE,
    file_url TEXT,
    status TEXT DEFAULT 'active',
    coverage_limits JSONB,
    deductibles JSONB,
    waiting_periods JSONB,
    exclusions JSONB,
    endorsements JSONB,
    notification_requirements JSONB,
    claim_risk_score INTEGER DEFAULT 0,
    ai_analysis_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
    user_id UUID NOT NULL REFERENCES profiles(id),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    paypal_subscription_id TEXT,
    paystack_subscription_id TEXT,
    tier TEXT NOT NULL DEFAULT 'starter',
    status TEXT NOT NULL DEFAULT 'active',
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    api_token_limit INTEGER NOT NULL DEFAULT 5,
    api_token_usage INTEGER NOT NULL DEFAULT 0,
    stripe_price_id TEXT,
    stripe_item_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Rulesets
CREATE TABLE IF NOT EXISTS audit_rulesets (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id),
    name TEXT NOT NULL,
    description TEXT,
    standard TEXT NOT NULL,
    rules JSONB NOT NULL,
    is_custom BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compliance Audits
CREATE TABLE IF NOT EXISTS compliance_audits (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id),
    contract_id INTEGER REFERENCES contracts(id),
    ruleset_id INTEGER REFERENCES audit_rulesets(id),
    audit_name TEXT NOT NULL,
    audit_type TEXT NOT NULL,
    scope JSONB,
    status TEXT NOT NULL DEFAULT 'in_progress',
    overall_compliance_score DOUBLE PRECISION,
    findings JSONB,
    compliance_by_standard JSONB,
    systemic_issues JSONB,
    executive_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risks
CREATE TABLE IF NOT EXISTS risks (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id),
    contract_id INTEGER NOT NULL REFERENCES contracts(id),
    risk_title TEXT NOT NULL,
    risk_category TEXT NOT NULL,
    risk_description TEXT,
    severity TEXT NOT NULL,
    likelihood TEXT NOT NULL,
    impact TEXT NOT NULL,
    risk_score INTEGER,
    mitigation_status TEXT NOT NULL DEFAULT 'identified',
    mitigation_strategies JSONB,
    financial_exposure_min DOUBLE PRECISION,
    financial_exposure_max DOUBLE PRECISION,
    ai_confidence INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clause Library
CREATE TABLE IF NOT EXISTS clause_library (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id),
    clause_name TEXT NOT NULL,
    clause_category TEXT NOT NULL,
    standard_language TEXT NOT NULL,
    jurisdiction TEXT,
    applicable_standards JSONB,
    risk_level_if_missing TEXT,
    is_mandatory BOOLEAN DEFAULT false
);

-- Savings Opportunities
CREATE TABLE IF NOT EXISTS savings_opportunities (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id),
    contract_id INTEGER NOT NULL REFERENCES contracts(id),
    description TEXT NOT NULL,
    type TEXT NOT NULL,
    estimated_savings DOUBLE PRECISION,
    status TEXT DEFAULT 'identified',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id),
    user_id UUID,
    organization_id TEXT,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    regulatory_body TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    ai_analysis JSONB,
    content JSONB,
    format TEXT NOT NULL DEFAULT 'pdf',
    file_url TEXT,
    generated_by TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor Scorecards
CREATE TABLE IF NOT EXISTS vendor_scorecards (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id),
    contract_id INTEGER NOT NULL REFERENCES contracts(id),
    vendor_name TEXT NOT NULL,
    compliance_score INTEGER,
    risk_score INTEGER,
    security_score INTEGER,
    sla_performance INTEGER,
    overall_grade TEXT,
    last_assessment_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id),
    client_id INTEGER REFERENCES clients(id),
    user_id UUID NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    details TEXT,
    ip_address TEXT,
    metadata JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Remediation Suggestions
CREATE TABLE IF NOT EXISTS remediation_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id INTEGER REFERENCES workspaces(id),
    contract_id INTEGER NOT NULL REFERENCES contracts(id),
    original_clause TEXT NOT NULL,
    suggested_clause TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ
);

-- Playbooks
CREATE TABLE IF NOT EXISTS playbooks (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    rules JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- User Playbooks
CREATE TABLE IF NOT EXISTS user_playbooks (
    user_id UUID NOT NULL REFERENCES profiles(id),
    playbook_id INTEGER NOT NULL REFERENCES playbooks(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Channels
CREATE TABLE IF NOT EXISTS notification_channels (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    provider TEXT NOT NULL,
    webhook_url TEXT NOT NULL,
    events TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id),
    user_id UUID NOT NULL REFERENCES profiles(id),
    contract_id INTEGER REFERENCES contracts(id),
    audit_id INTEGER REFERENCES compliance_audits(id),
    content TEXT NOT NULL,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contract Comparisons
CREATE TABLE IF NOT EXISTS contract_comparisons (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id),
    contract_id INTEGER NOT NULL REFERENCES contracts(id),
    comparison_type TEXT NOT NULL,
    overall_score INTEGER,
    clause_analysis JSONB,
    missing_clauses JSONB,
    key_recommendations JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Regulatory Alerts
CREATE TABLE IF NOT EXISTS regulatory_alerts (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id),
    standard TEXT NOT NULL,
    alert_title TEXT NOT NULL,
    alert_description TEXT NOT NULL,
    published_date TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending_rescan'
);

-- Infrastructure Logs
CREATE TABLE IF NOT EXISTS infrastructure_logs (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id),
    component TEXT NOT NULL,
    event TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'detected',
    action_taken TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Billing Telemetry
CREATE TABLE IF NOT EXISTS billing_telemetry (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id),
    client_id INTEGER REFERENCES clients(id),
    metric_type TEXT NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    cost DOUBLE PRECISION,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Clauses (per-contract extractions)
CREATE TABLE IF NOT EXISTS clauses (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id),
    contract_id INTEGER NOT NULL REFERENCES contracts(id),
    title TEXT,
    content TEXT NOT NULL,
    risk_level TEXT NOT NULL DEFAULT 'low',
    category TEXT NOT NULL,
    is_standard BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Remediation Tasks
CREATE TABLE IF NOT EXISTS remediation_tasks (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id),
    contract_id INTEGER NOT NULL REFERENCES contracts(id),
    finding_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    owner_id UUID REFERENCES profiles(id),
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor Benchmarks
CREATE TABLE IF NOT EXISTS vendor_benchmarks (
    id SERIAL PRIMARY KEY,
    service_type TEXT NOT NULL,
    service_category TEXT NOT NULL,
    market_average_annual DOUBLE PRECISION NOT NULL,
    currency TEXT DEFAULT 'USD',
    region TEXT DEFAULT 'East Africa',
    sample_size INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Continuous Monitoring
CREATE TABLE IF NOT EXISTS continuous_monitoring (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id),
    client_id INTEGER NOT NULL REFERENCES clients(id),
    ruleset_id INTEGER NOT NULL REFERENCES audit_rulesets(id),
    frequency_days INTEGER DEFAULT 7,
    is_active BOOLEAN DEFAULT true,
    last_run TIMESTAMPTZ,
    next_run TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace Listings
CREATE TABLE IF NOT EXISTS marketplace_listings (
    id SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id),
    seller_id UUID NOT NULL REFERENCES profiles(id),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    currency TEXT DEFAULT 'USD',
    rating DOUBLE PRECISION DEFAULT 0,
    sales_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace Purchases
CREATE TABLE IF NOT EXISTS marketplace_purchases (
    id SERIAL PRIMARY KEY,
    buyer_workspace_id INTEGER NOT NULL REFERENCES workspaces(id),
    buyer_id UUID NOT NULL REFERENCES profiles(id),
    listing_id INTEGER NOT NULL REFERENCES marketplace_listings(id),
    amount DOUBLE PRECISION NOT NULL,
    platform_fee DOUBLE PRECISION NOT NULL,
    seller_payout DOUBLE PRECISION NOT NULL,
    status TEXT DEFAULT 'completed',
    transaction_id TEXT,
    purchased_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- ADDITIVE COLUMN MIGRATIONS
-- For tables that may already exist without these columns.
-- All statements use IF NOT EXISTS — safe to re-run.
-- =========================================================

-- profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS client_id INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'analyst';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR DEFAULT 'starter';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS api_key TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name VARCHAR;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name VARCHAR;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS webauthn_id VARCHAR;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS webauthn_credential TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contracts_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- workspaces
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'enterprise';
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS webhook_url TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS webhook_enabled BOOLEAN DEFAULT false;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS api_usage_count INTEGER DEFAULT 0;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS api_usage_reset_date TIMESTAMPTZ;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS active_standards JSONB DEFAULT '[]';
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- workspace_members
ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';
ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS annual_budget DOUBLE PRECISION;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS risk_threshold INTEGER DEFAULT 70;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS compliance_focus TEXT DEFAULT 'KDPA';

-- contracts
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS annual_cost DOUBLE PRECISION;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS monthly_cost DOUBLE PRECISION;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_start_date DATE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS renewal_date DATE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS contract_term_months INTEGER;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS license_count INTEGER;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS auto_renewal BOOLEAN DEFAULT false;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS payment_frequency TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS ai_analysis JSONB;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- insurance_policies
ALTER TABLE insurance_policies ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE insurance_policies ADD COLUMN IF NOT EXISTS coverage_limits JSONB;
ALTER TABLE insurance_policies ADD COLUMN IF NOT EXISTS deductibles JSONB;
ALTER TABLE insurance_policies ADD COLUMN IF NOT EXISTS waiting_periods JSONB;
ALTER TABLE insurance_policies ADD COLUMN IF NOT EXISTS exclusions JSONB;
ALTER TABLE insurance_policies ADD COLUMN IF NOT EXISTS endorsements JSONB;
ALTER TABLE insurance_policies ADD COLUMN IF NOT EXISTS notification_requirements JSONB;
ALTER TABLE insurance_policies ADD COLUMN IF NOT EXISTS claim_risk_score INTEGER DEFAULT 0;
ALTER TABLE insurance_policies ADD COLUMN IF NOT EXISTS ai_analysis_summary TEXT;
ALTER TABLE insurance_policies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- subscriptions
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS paystack_subscription_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS api_token_limit INTEGER DEFAULT 5;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS api_token_usage INTEGER DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_item_id TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- audit_rulesets
ALTER TABLE audit_rulesets ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE audit_rulesets ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE audit_rulesets ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;

-- compliance_audits
ALTER TABLE compliance_audits ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE compliance_audits ADD COLUMN IF NOT EXISTS ruleset_id INTEGER;
ALTER TABLE compliance_audits ADD COLUMN IF NOT EXISTS scope JSONB;
ALTER TABLE compliance_audits ADD COLUMN IF NOT EXISTS overall_compliance_score DOUBLE PRECISION;
ALTER TABLE compliance_audits ADD COLUMN IF NOT EXISTS findings JSONB;
ALTER TABLE compliance_audits ADD COLUMN IF NOT EXISTS compliance_by_standard JSONB;
ALTER TABLE compliance_audits ADD COLUMN IF NOT EXISTS systemic_issues JSONB;
ALTER TABLE compliance_audits ADD COLUMN IF NOT EXISTS executive_summary TEXT;

-- risks
ALTER TABLE risks ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE risks ADD COLUMN IF NOT EXISTS risk_description TEXT;
ALTER TABLE risks ADD COLUMN IF NOT EXISTS mitigation_strategies JSONB;
ALTER TABLE risks ADD COLUMN IF NOT EXISTS financial_exposure_min DOUBLE PRECISION;
ALTER TABLE risks ADD COLUMN IF NOT EXISTS financial_exposure_max DOUBLE PRECISION;
ALTER TABLE risks ADD COLUMN IF NOT EXISTS ai_confidence INTEGER;

-- clause_library
ALTER TABLE clause_library ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE clause_library ADD COLUMN IF NOT EXISTS jurisdiction TEXT;
ALTER TABLE clause_library ADD COLUMN IF NOT EXISTS applicable_standards JSONB;
ALTER TABLE clause_library ADD COLUMN IF NOT EXISTS risk_level_if_missing TEXT;
ALTER TABLE clause_library ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN DEFAULT false;

-- savings_opportunities
ALTER TABLE savings_opportunities ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE savings_opportunities ADD COLUMN IF NOT EXISTS estimated_savings DOUBLE PRECISION;
ALTER TABLE savings_opportunities ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'identified';

-- reports
ALTER TABLE reports ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS organization_id TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS regulatory_body TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_analysis JSONB;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS content JSONB;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS generated_by TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- vendor_scorecards
ALTER TABLE vendor_scorecards ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE vendor_scorecards ADD COLUMN IF NOT EXISTS compliance_score INTEGER;
ALTER TABLE vendor_scorecards ADD COLUMN IF NOT EXISTS risk_score INTEGER;
ALTER TABLE vendor_scorecards ADD COLUMN IF NOT EXISTS security_score INTEGER;
ALTER TABLE vendor_scorecards ADD COLUMN IF NOT EXISTS sla_performance INTEGER;
ALTER TABLE vendor_scorecards ADD COLUMN IF NOT EXISTS overall_grade TEXT;
ALTER TABLE vendor_scorecards ADD COLUMN IF NOT EXISTS last_assessment_date TIMESTAMPTZ DEFAULT NOW();

-- audit_logs
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS client_id INTEGER;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS resource_type TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS resource_id TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS metadata JSONB;

-- remediation_suggestions
ALTER TABLE remediation_suggestions ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE remediation_suggestions ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

-- playbooks
ALTER TABLE playbooks ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE playbooks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE playbooks ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- notification_channels
ALTER TABLE notification_channels ADD COLUMN IF NOT EXISTS events TEXT[] DEFAULT '{}';
ALTER TABLE notification_channels ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE notification_channels ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- comments
ALTER TABLE comments ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS audit_id INTEGER;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT false;

-- contract_comparisons
ALTER TABLE contract_comparisons ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE contract_comparisons ADD COLUMN IF NOT EXISTS overall_score INTEGER;
ALTER TABLE contract_comparisons ADD COLUMN IF NOT EXISTS clause_analysis JSONB;
ALTER TABLE contract_comparisons ADD COLUMN IF NOT EXISTS missing_clauses JSONB;
ALTER TABLE contract_comparisons ADD COLUMN IF NOT EXISTS key_recommendations JSONB;

-- regulatory_alerts
ALTER TABLE regulatory_alerts ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE regulatory_alerts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_rescan';

-- infrastructure_logs
ALTER TABLE infrastructure_logs ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE infrastructure_logs ADD COLUMN IF NOT EXISTS action_taken TEXT;

-- billing_telemetry
ALTER TABLE billing_telemetry ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE billing_telemetry ADD COLUMN IF NOT EXISTS client_id INTEGER;
ALTER TABLE billing_telemetry ADD COLUMN IF NOT EXISTS cost DOUBLE PRECISION;

-- clauses
ALTER TABLE clauses ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE clauses ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE clauses ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'low';
ALTER TABLE clauses ADD COLUMN IF NOT EXISTS is_standard BOOLEAN DEFAULT false;

-- remediation_tasks
ALTER TABLE remediation_tasks ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE remediation_tasks ADD COLUMN IF NOT EXISTS finding_id TEXT;
ALTER TABLE remediation_tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE remediation_tasks ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE remediation_tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;
ALTER TABLE remediation_tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- continuous_monitoring
ALTER TABLE continuous_monitoring ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE continuous_monitoring ADD COLUMN IF NOT EXISTS frequency_days INTEGER DEFAULT 7;
ALTER TABLE continuous_monitoring ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE continuous_monitoring ADD COLUMN IF NOT EXISTS last_run TIMESTAMPTZ;
ALTER TABLE continuous_monitoring ADD COLUMN IF NOT EXISTS next_run TIMESTAMPTZ;

-- marketplace_listings
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS rating DOUBLE PRECISION DEFAULT 0;
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0;
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- marketplace_purchases
ALTER TABLE marketplace_purchases ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';
ALTER TABLE marketplace_purchases ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- =========================================================
-- PERFORMANCE INDEXES (created after additive migrations)
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_contracts_workspace ON contracts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_compliance_audits_workspace ON compliance_audits(workspace_id);
CREATE INDEX IF NOT EXISTS idx_risks_contract ON risks(contract_id);
CREATE INDEX IF NOT EXISTS idx_risks_workspace ON risks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_workspace ON subscriptions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_remediation_tasks_workspace ON remediation_tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_clause_library_workspace ON clause_library(workspace_id);

-- =========================================================
SELECT 'Schema sync v3 complete — all tables and columns patched.' AS status;
