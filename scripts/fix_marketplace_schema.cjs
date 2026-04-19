require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function harmonise() {
  console.log('🛠️ Harmonizing marketplace_purchases...');
  try {
    await client.connect();
    
    // Add workspace_id if missing
    await client.query('ALTER TABLE marketplace_purchases ADD COLUMN IF NOT EXISTS workspace_id INTEGER;');
    
    // Backfill from buyer_workspace_id
    await client.query('UPDATE marketplace_purchases SET workspace_id = buyer_workspace_id WHERE workspace_id IS NULL;');
    
    console.log('✅ marketplace_purchases harmonized.');
  } catch (err) {
    console.error('❌ Harmonization failed:', err.message);
  } finally {
    await client.end();
  }
}

harmonise();
