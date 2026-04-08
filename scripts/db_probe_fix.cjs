const { Client } = require('pg');
require('dotenv').config();

async function probe() {
  const projectRef = "ulercnwyckrcjcnrenzz";
  const password = "CyberOptimizeDb2026!";
  
  // Try direct connection instead of pooler
  const directUrl = `postgres://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;
  
  console.log("📡 Attempting DIRECT connection to Supabase...");
  console.log(`URL: ${directUrl.replace(password, '****')}`);

  const client = new Client({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("✅ Successfully CONNECTED to database!");
    
    console.log("🛠️ Testing schema write permissions...");
    await client.query("CREATE TABLE IF NOT EXISTS _antigravity_test (id serial primary key, ts timestamptz default now());");
    console.log("✅ Managed to CREATE a test table.");
    
    await client.query("DROP TABLE _antigravity_test;");
    console.log("✅ Managed to DROP the test table.");
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Connection FAILED:", err.message);
    if (err.message.includes("Tenant or user not found")) {
      console.error("HINT: The project reference might be wrong or the user/password is failing for direct access.");
    }
    process.exit(1);
  }
}

probe();
