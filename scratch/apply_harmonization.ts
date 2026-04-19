import { readFileSync } from 'fs';
import pg from 'pg';
const { Client } = pg;

async function applyHarmonization() {
  const env = readFileSync('.env', 'utf8');
  let dbUrl = env.match(/DATABASE_URL=(.*)/)?.[1]?.trim();
  
  if (!dbUrl) {
    console.error("Missing DATABASE_URL");
    process.exit(1);
  }

  // Strip query params to prevent conflicts with the ssl object
  const cleanUrl = dbUrl.split('?')[0];

  console.log("🚀 Connecting to Supabase via Postgres protocol (SSL bypass enabled)...");
  const client = new Client({
    connectionString: cleanUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  const sqlFile = process.argv[2] || 'scripts/final_harmonization.sql';

  try {
    await client.connect();
    console.log(`✅ Connected. Reading script: ${sqlFile}...`);
    const sql = readFileSync(sqlFile, 'utf8');
    
    console.log("⚡ Executing SQL...");
    // We execute line by line or block by block if needed, but the script has BEGIN/COMMIT
    await client.query(sql);
    
    console.log("🎉 DATABASE HARMONIZED SUCCESSFULLY!");
  } catch (err: any) {
    console.error("💥 FAILED TO HARMONIZE DB:", err.message);
    if (err.detail) console.error("Detail:", err.detail);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyHarmonization();
