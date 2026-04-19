require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function auditTypes() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('profiles', 'workspace_members', 'contracts', 'marketplace_purchases')
      ORDER BY table_name, column_name;
    `);
    console.table(res.rows);
  } catch (err) {
    console.error('❌ Audit failed:', err.message);
  } finally {
    await client.end();
  }
}

auditTypes();
