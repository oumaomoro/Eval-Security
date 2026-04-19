import { readFileSync } from 'fs';
import pg from 'pg';
const { Client } = pg;

async function check() {
  const env = readFileSync('.env', 'utf8');
  const dbUrl = env.match(/DATABASE_URL=(.*)/)[1].trim();
  const cleanUrl = dbUrl.split('?')[0];
  const client = new Client({ connectionString: cleanUrl, ssl: { rejectUnauthorized: false } });
  
  await client.connect();
  await client.query("NOTIFY pgrst, 'reload schema';");
  console.log('Schema cache reloaded!');
  await client.end();
}

check();
