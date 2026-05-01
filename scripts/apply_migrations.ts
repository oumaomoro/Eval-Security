/**
 * Costloci Migration Runner
 * Applies raw SQL patches to the Supabase instance.
 * Usage: npx tsx scripts/apply_migrations.ts
 */
import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';
import { resolve } from 'path';

async function applyMigration(dbUrl: string, filePath: string) {
    const sql = readFileSync(resolve(process.cwd(), filePath), 'utf-8');
    const client = new Client({ connectionString: dbUrl });
    
    try {
        console.log(`[MIGRATE] Applying ${filePath}...`);
        await client.connect();
        await client.query(sql);
        console.log(`[MIGRATE] ✅ ${filePath} applied successfully.`);
    } catch (err: any) {
        console.error(`[MIGRATE] ❌ Failed to apply ${filePath}:`, err.message);
        // We don't exit(1) here to allow other migrations to attempt
    } finally {
        await client.end();
    }
}

async function run() {
    // Load .env
    try {
        const envFile = readFileSync(resolve(process.cwd(), ".env"), "utf-8");
        for (const line of envFile.split(/\r?\n/)) {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
            if (match) {
                let val = (match[2] || "").trim();
                if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
                process.env[match[1]] = val;
            }
        }
    } catch { /* ok */ }

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error("❌ Missing DATABASE_URL in .env");
        process.exit(1);
    }

    const migrations = [
        "scripts/final_prod_patch.sql",
        "supabase/migrations/0002_indexes_and_schedules.sql"
    ];

    for (const migration of migrations) {
        await applyMigration(dbUrl, migration);
    }
}

run().catch(err => {
    console.error("💥 Fatal Migration Error:", err);
    process.exit(1);
});
