import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function testConnection() {
  console.log('🔍 Testing Database Sovereignty...');
  console.log('URL: ' + process.env.DATABASE_URL?.substring(0, 50) + '...');
  
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ DATABASE REACHED (Real-time Link Established)');
    const res = await client.query('SELECT NOW()');
    console.log('Result: ' + res.rows[0].now);
    await client.end();
  } catch (err: any) {
    console.error('❌ CONNECTION FAILED: ' + err.message);
    if (err.code === 'ENOTFOUND') {
      console.log('Suggestion: DNS is failing for the Supabase host. Project may be paused or IPv6 related.');
    }
  }
}

testConnection();
