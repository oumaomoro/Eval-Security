import pg from 'pg';
const { Client } = pg;

const connectionString = "postgres://postgres:CyberOptimizeDb2026!@db.ulercnwyckrcjcnrenzz.supabase.co:6543/postgres";

async function test() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    console.log("Connecting...");
    await client.connect();
    console.log("SUCCESS");
    await client.end();
  } catch (err) {
    console.error("FAIL:", err.message);
  }
}
test();
