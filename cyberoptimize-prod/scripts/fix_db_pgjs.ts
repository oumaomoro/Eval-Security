import postgres from "postgres";

const host = "aws-0-us-east-1.pooler.supabase.com";
const projectId = "ulercnwyckrcjcnrenzz";
const password = "CyberOptimizeDb2026!";

async function fix() {
  const sql = postgres(`postgres://postgres.${projectId}:${password}@${host}:6543/postgres`, {
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("Connecting using postgres-js...");
    await sql`
      ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS owner_id text;
    `;
    console.log("owner_id added.");

    await sql`
      CREATE TABLE IF NOT EXISTS workspace_members (
        id serial PRIMARY KEY,
        user_id text NOT NULL,
        workspace_id integer NOT NULL,
        role text NOT NULL DEFAULT 'viewer',
        created_at timestamp DEFAULT current_timestamp
      );
    `;
    console.log("workspace_members added.");

    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id serial PRIMARY KEY,
        user_id text NOT NULL,
        contract_id integer,
        audit_id integer,
        content text NOT NULL,
        resolved boolean DEFAULT false,
        created_at timestamp DEFAULT current_timestamp
      );
    `;
    console.log("comments added.");

  } catch (err: any) {
    console.error("Error:", err.message);
  } finally {
    await sql.end();
  }
}

fix();
