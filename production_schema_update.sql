-- Costloci Enterprise - Production Schema Hardening
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/ulercnwyckrcjcnrenzz/sql/new

BEGIN;

-- 1. Hardening Profiles Table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'starter',
ADD COLUMN IF NOT EXISTS contracts_count INTEGER DEFAULT 0;

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

-- 4. Creating Contract Clauses Table
CREATE TABLE IF NOT EXISTS clauses (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER REFERENCES contracts(id),
    title TEXT,
    content TEXT,
    risk_level TEXT DEFAULT 'low',
    category TEXT,
    is_standard BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Hardening Workspace Members (Permissions Support)
ALTER TABLE workspace_members
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';

COMMIT;
