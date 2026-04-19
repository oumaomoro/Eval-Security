require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function verify() {
  console.log('🧪 RLS Enforcement Verification...');
  try {
    await client.connect();
    
    // 1. Get a test user and their workspace
    const userRes = await client.query(`
      SELECT user_id, workspace_id 
      FROM workspace_members 
      LIMIT 1;
    `);
    
    if (userRes.rows.length === 0) {
      console.warn('⚠️ No workspace members found. Test aborted.');
      return;
    }
    
    const { user_id, workspace_id } = userRes.rows[0];
    console.log(`- Simulating session for User: ${user_id} in Workspace: ${workspace_id}`);
    
    // 2. Start a transaction to simulate the user session
    await client.query('BEGIN;');
    
    // Simulate Supabase/PostgREST session variables
    // Note: auth.uid() function in Supabase reads from request.jwt.claims
    // We can simulate this by setting the setting 'request.jwt.claims'
    await client.query(`
      SELECT set_config('request.jwt.claims', $1, true);
    `, [JSON.stringify({ sub: user_id, role: 'authenticated' })]);
    
    // Switch to 'authenticated' role
    await client.query('SET LOCAL ROLE authenticated;');
    
    // 3. Query contracts
    const contracts = await client.query('SELECT vendor_name, workspace_id FROM contracts;');
    console.log(`- User saw ${contracts.rows.length} contracts.`);
    
    const leaks = contracts.rows.filter(c => c.workspace_id !== workspace_id);
    if (leaks.length > 0) {
      console.error(`❌ CRITICAL: User saw ${leaks.length} contracts from OTHER workspaces!`);
      console.table(leaks);
    } else if (contracts.rows.length === 0) {
      console.log('ℹ️ User saw 0 contracts. This might be correct if the workspace is empty.');
    } else {
      console.log('✅ PASS: All visible contracts belonging to the user\'s workspace.');
    }
    
    await client.query('ROLLBACK;');
  } catch (err) {
    console.error('❌ Verification failed:', err.message);
  } finally {
    await client.end();
  }
}

verify();
