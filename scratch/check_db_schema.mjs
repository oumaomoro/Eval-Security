import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres.ulercnwyckrcjcnrenzz:bU2LA8gMGSv!!k*@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require';

async function checkSchema() {
  const client = new Client({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log('--- DATABASE SCHEMA CHECK ---');
    
    // Check Profiles
    const profileRes = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles'");
    const columns = profileRes.rows.map(r => r.column_name);
    console.log('Profiles Columns:', columns.join(', '));
    
    const required = ['subscription_tier', 'contracts_count', 'organization_id', 'client_id'];
    const missing = required.filter(c => !columns.includes(c));
    console.log('Missing Columns (Profiles):', missing.length ? missing.join(', ') : 'NONE');

    // Check Organizations
    const orgRes = await client.query("SELECT * FROM information_schema.tables WHERE table_name = 'organizations'");
    console.log('Organizations table exists:', orgRes.rowCount > 0);

    // Check Role Constraint
    const constraintRes = await client.query("SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'profiles_role_check'");
    console.log('Role Constraint:', constraintRes.rows.length ? constraintRes.rows[0].pg_get_constraintdef : 'MISSING');

    await client.end();
  } catch (err) {
    console.error('Schema check failed:', err.message);
  }
}

checkSchema();
