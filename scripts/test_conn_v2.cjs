require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

async function testConnection() {
  const configs = [
    { name: 'EU-WEST-1 Pooler', host: 'aws-1-eu-west-1.pooler.supabase.com', port: 6543, user: 'postgres.ulercnwyckrcjcnrenzz', pass: 'CyberOptimizeDb2026!' },
    { name: 'EU-WEST-1 OldPass', host: 'aws-1-eu-west-1.pooler.supabase.com', port: 6543, user: 'postgres.ulercnwyckrcjcnrenzz', pass: 'bU2LA8gMGSv!!k*' },
    { name: 'EU-CENTRAL-1 Pooler', host: 'aws-0-eu-central-1.pooler.supabase.com', port: 6543, user: 'postgres.ulercnwyckrcjcnrenzz', pass: 'CyberOptimizeDb2026!' }
  ];

  for (const config of configs) {
    console.log(`Testing ${config.name}...`);
    const client = new Client({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.pass,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
    });

    try {
      await client.connect();
      const res = await client.query('SELECT current_user, current_database();');
      console.log(`✅ ${config.name} success:`, res.rows[0]);
      await client.end();
      return;
    } catch (err) {
      console.error(`❌ ${config.name} failed:`, err.message);
    }
  }
}

testConnection();
