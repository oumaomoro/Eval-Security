import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

/**
 * SOVEREIGN DB CONNECTION (LAZY)
 * Delayed initialization to prevent boot errors when Port 5432 is blocked.
 * This ensures the REST Sovereignty Bridge (Port 443) can start regardless
 * of the direct Postgres connection status.
 */
let _pool: pg.Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      console.warn("⚠️  DATABASE_URL is missing. DB Direct access is disabled. Falling back to REST Sovereignty Bridge.");
      return null;
    }

    const sslConfig = process.env.DATABASE_URL.includes("supabase.co")
      ? { ssl: { rejectUnauthorized: false } }
      : {};

    _pool = new Pool({
      connectionString: process.env.DATABASE_URL.trim(),
      ...sslConfig,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Handle background pool errors silently to prevent process crash
    _pool.on('error', (err) => {
      console.error('⚠️  Postgres Pool Error:', err.message);
    });

    _db = drizzle(_pool, { schema });
  }
  return _db;
}

// Proxy for backward compatibility
export const db = new Proxy({} as any, {
  get: (_target, prop) => {
    const d = getDb();
    if (!d) throw new Error("Database direct access is unavailable. Ensure DATABASE_URL is set or use the REST Storage layer.");
    return (d as any)[prop];
  }
});

export { _pool as pool };
