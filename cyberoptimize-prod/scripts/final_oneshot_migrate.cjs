const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const sql = `
BEGIN;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'starter', ADD COLUMN IF NOT EXISTS contracts_count INTEGER DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS compliance_focus TEXT DEFAULT 'KDPA', ADD COLUMN IF NOT EXISTS risk_threshold INTEGER DEFAULT 70;
CREATE TABLE IF NOT EXISTS comments (id SERIAL PRIMARY KEY, user_id TEXT REFERENCES profiles(id) NOT NULL, contract_id INTEGER REFERENCES contracts(id), audit_id INTEGER REFERENCES compliance_audits(id), content TEXT NOT NULL, resolved BOOLEAN DEFAULT FALSE, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
CREATE TABLE IF NOT EXISTS clauses (id SERIAL PRIMARY KEY, contract_id INTEGER REFERENCES contracts(id), title TEXT, content TEXT, risk_level TEXT DEFAULT 'low', category TEXT, is_standard BOOLEAN DEFAULT FALSE, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';
COMMIT;
`;

async function run() {
  const client = new Client({
    connectionString: "postgresql://postgres.ulercnwyckrcjcnrenzz:bU2LA8gMGSv!!k*@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require",
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('CONNECTED - Starting one-shot migration...');
    await client.query(sql);
    console.log('SUCCESS - Migration applied successfully!');
  } catch (err) {
    console.error('FAILED - Automated migration error:', err.message);
  } finally {
    await client.end();
  }
}

run();
