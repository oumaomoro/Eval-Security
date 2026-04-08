import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

async function fixDatabase() {
  console.log("🚀 Attempting High-Precision Database Synchronization...");
  
  // Construct the direct connection URL with project options to bypass PgBouncer tenant issues
  // Using the project reference directly in the username is standard for Supabase Pooler
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error("❌ DATABASE_URL not found in environment.");
    return;
  }

  const sql = postgres(connectionString, {
    ssl: 'require',
    max: 1,
    idle_timeout: 3,
    connect_timeout: 10,
  });

  try {
    console.log("📡 Connecting to Supabase PostgreSQL...");
    
    await sql.begin(async (tx) => {
      console.log("🛠️  Adding missing columns and tables...");

      // 1. Workspaces stability
      await tx`ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS owner_id text;`;
      
      // 2. Billing Telemetry
      await tx`
        CREATE TABLE IF NOT EXISTS billing_telemetry (
          id SERIAL PRIMARY KEY,
          client_id INTEGER REFERENCES clients(id),
          metric_type TEXT NOT NULL,
          value INTEGER NOT NULL,
          cost DECIMAL(10,2) DEFAULT 0,
          timestamp TIMESTAMPTZ DEFAULT NOW()
        );
      `;

      // 3. Infrastructure Logs
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

      // 4. Workspace Members
      await tx`
        CREATE TABLE IF NOT EXISTS workspace_members (
          id SERIAL PRIMARY KEY,
          workspace_id INTEGER REFERENCES workspaces(id),
          user_id TEXT REFERENCES profiles(id),
          role TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;

      // 5. Comments
      await tx`
        CREATE TABLE IF NOT EXISTS comments (
          id SERIAL PRIMARY KEY,
          contract_id INTEGER REFERENCES contracts(id),
          audit_id INTEGER,
          user_id TEXT REFERENCES profiles(id),
          content TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
    });

    console.log("✅ Database schema synchronized successfully (Sovereign Mode Restored).");
  } catch (err: any) {
    console.error("❌ Database sync failed:", err.message);
    if (err.message.includes("Tenant or user not found")) {
      console.warn("💡 Suggestion: Try using a direct connection (Session mode) instead of Transaction mode (Pooler).");
    }
  } finally {
    await sql.end();
  }
}

fixDatabase();
