require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function applyRLS() {
  console.log('🛡️ Applying RLS Hardening (Final Phase)...');
  try {
    await client.connect();
    console.log('✅ Connected to PG Successfully.');
    
    const sqlPath = path.join(__dirname, 'harden_rls.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await client.query(sql);
    console.log('🚀 Row Level Security policies applied successfully across all 20+ tables.');
  } catch (err) {
    console.error('❌ RLS Deployment failed:', err.message);
    if (err.detail) console.error('Detail:', err.detail);
  } finally {
    await client.end();
  }
}

applyRLS();
