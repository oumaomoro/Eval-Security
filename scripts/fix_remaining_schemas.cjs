require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function harmonise() {
  const targets = ['risk_register', 'remediation_tasks'];
  console.log('🛠️ Harmonizing final tables...');
  try {
    await client.connect();
    
    for (const t of targets) {
      console.log(`- Patching ${t}...`);
      await client.query(`ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS workspace_id INTEGER;`);
    }
    
    console.log('✅ Final tables harmonized.');
  } catch (err) {
    console.error('❌ Harmonization failed:', err.message);
  } finally {
    await client.end();
  }
}

harmonise();
