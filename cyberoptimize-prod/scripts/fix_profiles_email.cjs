const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'db.ulercnwyckrcjcnrenzz.supabase.co',
  database: 'postgres',
  password: 'CyberOptimizeDb2026!',
  port: 6543,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    await client.connect();
    console.log("Connected to Supabase DB (Explicit Parameters).");

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
