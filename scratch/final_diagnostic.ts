import { readFileSync } from 'fs';
import pg from 'pg';
const { Client } = pg;

async function finalDiagnostic() {
  const env = readFileSync('.env', 'utf8');
  const dbUrl = env.match(/DATABASE_URL=(.*)/)?.[1]?.trim().split('?')[0];

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    console.log("--- PROFILES CHECK ---");
    const profiles = await client.query("SELECT id, email, role FROM profiles ORDER BY created_at DESC LIMIT 5");
    console.table(profiles.rows);

    console.log("\n--- WORKSPACES CHECK ---");
    const workspaces = await client.query("SELECT id, name, owner_id FROM workspaces LIMIT 5");
    console.table(workspaces.rows);

    console.log("\n--- MEMBERSHIP CHECK ---");
    const members = await client.query("SELECT * FROM workspace_members LIMIT 5");
    console.table(members.rows);

  } catch (err: any) {
    console.error("Diagnostic failed:", err.message);
  } finally {
    await client.end();
  }
}

finalDiagnostic();
