const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

// Manual .env loader
try {
  const envPath = path.resolve(process.cwd(), ".env");
  const envFile = fs.readFileSync(envPath, "utf-8");
  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match && !process.env[match[1]]) {
      let val = match[2] || "";
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      process.env[match[1]] = val;
    }
  }
} catch (e) {}

async function syncSchema() {
  const projectRef = "ulercnwyckrcjcnrenzz";
  const password = "CyberOptimizeDb2026!";
  const directUrl = `postgres://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;

  console.log("🚀 Restoring Sovereign Mode: Synchronizing Database Schema...");
  console.log(`📡 Connecting directly to: db.${projectRef}.supabase.co`);

  const sql = postgres(directUrl, {
    ssl: { rejectUnauthorized: false }, 
    max: 1,
    connect_timeout: 10,
  });

  try {
    await sql.begin(async (tx) => {
      console.log("🛠️  Syncing workspaces infrastructure...");
      await tx`ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS owner_id text;`;
      
      console.log("🛠️  Creating enterprise collaboration tables...");
      await tx`
        CREATE TABLE IF NOT EXISTS billing_telemetry (
          id SERIAL PRIMARY KEY,
          client_id INTEGER,
          metric_type TEXT NOT NULL,
          value INTEGER NOT NULL,
          cost DECIMAL(10,2) DEFAULT 0,
          timestamp TIMESTAMPTZ DEFAULT NOW()
        );
      `;

      await tx`
        CREATE TABLE IF NOT EXISTS infrastructure_logs (
          id SERIAL PRIMARY KEY,
          timestamp TIMESTAMPTZ DEFAULT NOW(),
          component TEXT NOT NULL,
          event TEXT NOT NULL,
          status TEXT DEFAULT 'active',
          action_taken TEXT
        );
      `;

      await tx`
        CREATE TABLE IF NOT EXISTS workspace_members (
          id SERIAL PRIMARY KEY,
          workspace_id INTEGER,
          user_id TEXT,
          role TEXT DEFAULT 'viewer',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;

      await tx`
        CREATE TABLE IF NOT EXISTS comments (
          id SERIAL PRIMARY KEY,
          contract_id INTEGER,
          audit_id INTEGER,
          user_id TEXT,
          content TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
    });

    console.log("✅ Sovereign Mode Restored. 100% Persistence Active.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Schema sync failed:", err.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

syncSchema();
