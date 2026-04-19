require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function listTables() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('--- TABLES IN PUBLIC SCHEMA ---');
    console.log(res.rows.map(r => r.table_name).join('\n'));
    console.log('-------------------------------');
  } catch (err) {
    console.error('❌ Failed to list tables:', err.message);
  } finally {
    await client.end();
  }
}

listTables();
