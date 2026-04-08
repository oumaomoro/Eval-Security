import pg from 'pg';

async function verify() {
  const connectionString = "postgres://postgres:CyberOptimizeDb2026!@ulercnwyckrcjcnrenzz.supabase.co:5432/postgres?sslmode=require";
  console.log("🚀 Initializing Sovereign DB Link (Direct Project Host)...");
  
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("✅ LIVE DB CONNECTION ESTABLISHED (Zero-Mock Latency)");
    const res = await client.query('SELECT NOW() as now, current_database() as db');
    console.log(`- Timestamp: ${res.rows[0].now}`);
    console.log(`- Database: ${res.rows[0].db}`);
    await client.end();
  } catch (err: any) {
    console.error("❌ SOVEREIGN LINK FAILED: " + err.message);
    process.exit(1);
  }
}

verify();
