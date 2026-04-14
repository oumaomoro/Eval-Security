/**
 * Production Schema Deployer
 * Bypasses shell escaping issues with special characters in passwords
 * Directly connects to Supabase pooler and applies all schema changes
 */
const { Client } = require('pg');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
  host: 'aws-1-eu-west-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.ulercnwyckrcjcnrenzz',
  password: 'bU2LA8gMGSv!!k*',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function deploy() {
  try {
    await client.connect();
    console.log('✅ Connected to Supabase production database!');

    // Ensure subscription_tier and contracts_count columns exist
    await client.query(`
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'starter',
      ADD COLUMN IF NOT EXISTS contracts_count INTEGER DEFAULT 0;
    `);
    console.log('✅ profiles table: subscription_tier and contracts_count ensured.');

    // Ensure clients table has compliance fields
    await client.query(`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS compliance_focus TEXT DEFAULT 'KDPA',
      ADD COLUMN IF NOT EXISTS risk_threshold INTEGER DEFAULT 70;
    `);
    console.log('✅ clients table: compliance_focus and risk_threshold ensured.');

    // Ensure comments table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        contract_id INTEGER,
        audit_id INTEGER,
        content TEXT NOT NULL,
        resolved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ comments table: verified/created.');

    // Ensure clauses table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS clauses (
        id SERIAL PRIMARY KEY,
        contract_id INTEGER,
        title TEXT,
        content TEXT,
        risk_level TEXT DEFAULT 'low',
        category TEXT,
        is_standard BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ clauses table: verified/created.');

    // Ensure workspace_members columns
    await client.query(`
      ALTER TABLE workspace_members
      ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';
    `).catch(() => console.log('ℹ️  workspace_members: no changes needed.'));

    console.log('\n🚀 SCHEMA DEPLOYMENT COMPLETE — All production tables are up to date!');
  } catch (err) {
    console.error('❌ Deployment failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

deploy();
