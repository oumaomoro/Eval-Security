require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

async function testConnection() {
  const configs = [
    { name: 'Pooler 6543', port: 6543, user: 'postgres.ulercnwyckrcjcnrenzz' },
    { name: 'Pooler 5432', port: 5432, user: 'postgres.ulercnwyckrcjcnrenzz' },
    { name: 'Direct 5432', port: 5432, user: 'postgres' }
  ];

  for (const config of configs) {
    console.log(`Testing ${config.name}...`);
    const client = new Client({
      host: 'aws-0-eu-central-1.pooler.supabase.com',
      port: config.port,
      user: config.user,
      password: 'CyberOptimizeDb2026!',
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
    });

    try {
      await client.connect();
      const res = await client.query('SELECT current_user, current_database();');
      console.log(`✅ ${config.name} success:`, res.rows[0]);
      await client.end();
      return; // Stop if one works
    } catch (err) {
      console.error(`❌ ${config.name} failed:`, err.message);
    }
  }
}

testConnection();
