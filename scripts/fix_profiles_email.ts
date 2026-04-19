import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    await client.connect();
    console.log("Connected to Supabase DB.");

    const sql = `
      ALTER TABLE public.profiles 
      ADD COLUMN IF NOT EXISTS email text UNIQUE;
      
      -- Force PostgREST schema cache reload
      NOTIFY pgrst, 'reload schema';
    `;

    console.log("Applying schema fix: adding 'email' column to 'profiles'...");
    await client.query(sql);
    console.log("✅ Schema fix applied successfully.");

  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
