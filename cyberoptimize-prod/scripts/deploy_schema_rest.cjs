/**
 * Production Schema Deployer — via Supabase REST API
 * Uses service_role key to execute raw SQL through the REST rpc endpoint
 * This bypasses pooler DDL restrictions entirely
 */
const https = require('https');

const SUPABASE_URL = 'https://ulercnwyckrcjcnrenzz.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZXJjbnd5Y2tyY2pjbnJlbnp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTE1MzAwNSwiZXhwIjoyMDg2NzI5MDA1fQ.SXDMWdAl_cWia_IZZi7L6Q-SCNeKC_WWqMuMzC4pZr0';

function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const url = new URL('/rest/v1/rpc/exec_sql', SUPABASE_URL);
    // Use the pg REST endpoint directly
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Use Supabase Management API to run SQL
function runMgmtSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: 'ulercnwyckrcjcnrenzz.supabase.co',
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function deploy() {
  const migrations = [
    {
      name: 'profiles: subscription_tier + contracts_count',
      sql: `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'starter', ADD COLUMN IF NOT EXISTS contracts_count INTEGER DEFAULT 0;`
    },
    {
      name: 'clients: compliance_focus + risk_threshold',
      sql: `ALTER TABLE clients ADD COLUMN IF NOT EXISTS compliance_focus TEXT DEFAULT 'KDPA', ADD COLUMN IF NOT EXISTS risk_threshold INTEGER DEFAULT 70;`
    },
    {
      name: 'comments table',
      sql: `CREATE TABLE IF NOT EXISTS comments (id SERIAL PRIMARY KEY, user_id TEXT NOT NULL, contract_id INTEGER, audit_id INTEGER, content TEXT NOT NULL, resolved BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT NOW());`
    },
    {
      name: 'clauses table',
      sql: `CREATE TABLE IF NOT EXISTS clauses (id SERIAL PRIMARY KEY, contract_id INTEGER, title TEXT, content TEXT, risk_level TEXT DEFAULT 'low', category TEXT, is_standard BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT NOW());`
    }
  ];

  console.log('🚀 Starting production schema deployment via Supabase REST API...\n');
  
  for (const migration of migrations) {
    try {
      const result = await runMgmtSQL(migration.sql);
      if (result.status >= 200 && result.status < 300) {
        console.log(`✅ ${migration.name}`);
      } else {
        console.log(`⚠️  ${migration.name} → HTTP ${result.status}: ${result.body}`);
      }
    } catch (err) {
      console.error(`❌ ${migration.name} → ${err.message}`);
    }
  }
  
  console.log('\n🎯 Schema deployment finished!');
}

deploy();
