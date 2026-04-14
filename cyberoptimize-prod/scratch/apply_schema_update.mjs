import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';

const connectionString = 'postgresql://postgres.ulercnwyckrcjcnrenzz:bU2LA8gMGSv!!k*@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require';

async function runMigration() {
  const client = new Client({ 
    connectionString,
    ssl: { 
      rejectUnauthorized: false,
    }
  });
  
  try {
    await client.connect();
    console.log('--- APPLYING PRODUCTION SCHEMA HARDENING ---');
    
    const sql = fs.readFileSync('production_schema_update.sql', 'utf8');
    
    await client.query(sql);
    
    console.log('✅ Schema Hardening Applied Successfully.');
    await client.end();
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

runMigration();
