import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("No DATABASE_URL found in .env");
  process.exit(1);
}

const client = new Client({
  connectionString,
});

async function runMigration() {
  try {
    await client.connect();
    console.log("Connected to database...");
    
    const migrationPath = path.join(process.cwd(), 'scripts', 'final_prod_patch.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log("Applying migration final_prod_patch.sql...");
    await client.query(sqlContent);
    
    console.log("Migration applied successfully!");
  } catch (e) {
    console.error("Migration failed:", e);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
