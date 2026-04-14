-- Costloci Enterprise - Production Schema Hardening
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/ulercnwyckrcjcnrenzz/sql/new

BEGIN;

-- 1. Hardening Profiles Table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'starter',
ADD COLUMN IF NOT EXISTS contracts_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS api_key TEXT;


-- 2. Hardening Clients Table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS compliance_focus TEXT DEFAULT 'KDPA',
ADD COLUMN IF NOT EXISTS risk_threshold INTEGER DEFAULT 70;

-- 3. Creating Enterprise Comments Table
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES profiles(id) NOT NULL,
    contract_id INTEGER REFERENCES contracts(id),
    audit_id INTEGER REFERENCES compliance_audits(id),
    content TEXT NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Creating Contract Clauses Table (Instances)
CREATE TABLE IF NOT EXISTS clauses (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER REFERENCES contracts(id) NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    risk_level TEXT DEFAULT 'low',
    category TEXT NOT NULL,
    is_standard BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4b. Creating Clause Library Table (Standards)
CREATE TABLE IF NOT EXISTS clause_library (
    id SERIAL PRIMARY KEY,
    clause_name TEXT NOT NULL,
    clause_category TEXT NOT NULL,
    standard_language TEXT NOT NULL,
    jurisdiction TEXT,
    applicable_standards JSONB DEFAULT '[]',
    risk_level_if_missing TEXT,
    is_mandatory BOOLEAN DEFAULT FALSE
);


-- 5. Hardening Workspace Members (Permissions Support)
ALTER TABLE workspace_members
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';

-- 6. Hardening Infrastructure Logs (Resolving PGRST204 Cache Desync)
CREATE TABLE IF NOT EXISTS infrastructure_logs (
    id SERIAL PRIMARY KEY,
    component TEXT NOT NULL,
    event TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'detected',
    action_taken TEXT,
    "actionTaken" TEXT, -- Diagnostic Alias for PostgREST Cache support
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Hardening Billing & Telemetry Layer
CREATE TABLE IF NOT EXISTS billing_telemetry (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    metric_type TEXT NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    cost DOUBLE PRECISION DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Hardening Identity Gateways (Resolving Constraint Desync)
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'analyst', 'executive', 'owner', 'user', 'msa_officer', 'msp_admin'));

COMMIT;
