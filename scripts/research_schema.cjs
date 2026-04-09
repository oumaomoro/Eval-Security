const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Manually load .env to get credentials
const envPath = path.resolve(process.cwd(), '.env');
const envFile = fs.readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envFile.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value;
  }
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function research() {
  const client = new Client({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('--- DATABASE SCHEMA RESEARCH ---');

    // Check tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const tables = tablesRes.rows.map(r => r.table_name);
    console.log('Existing tables:', tables);

    // Check columns in profiles
    const profColsRes = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'profiles'
    `);
    console.log('Profiles columns:', profColsRes.rows.map(r => r.column_name));

    // Check columns in clients
    const clientColsRes = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'clients'
    `);
    console.log('Clients columns:', clientColsRes.rows.map(r => r.column_name));

  } catch (err) {
    console.error('Research failed:', err.message);
  } finally {
    await client.end();
  }
}

research();
