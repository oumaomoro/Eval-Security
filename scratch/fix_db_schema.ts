import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const urls = [
  process.env.DATABASE_URL,
  "postgresql://postgres.ulercnwyckrcjcnrenzz:CyberOptimizeDb2026!@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require"
];

async function fix() {
  for (const url of urls) {
    if (!url) continue;
    console.log(`Trying to connect to: ${url.split('@')[1]}`);
    const client = new pg.Client({ connectionString: url });
    try {
      await client.connect();
      console.log("Connected!");
      
      console.log("Adding missing columns to audit_rulesets...");
      await client.query(`
        ALTER TABLE audit_rulesets 
        ADD COLUMN IF NOT EXISTS workspace_id INTEGER REFERENCES workspaces(id),
        ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;
      `);
      console.log("Success!");
      await client.end();
      return;
    } catch (err) {
      console.error(`Failed with url: ${url.split('@')[1]}`, err.message);
    }
  }
}

fix();
