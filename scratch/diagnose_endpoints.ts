import { readFileSync } from 'fs';
import fetch from 'node-fetch';

async function diagnose() {
  const env = readFileSync('.env', 'utf8');
  const url = env.match(/SUPABASE_URL=(.*)/)?.[1]?.trim();
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();

  if (!url || !key) {
    console.error("Missing config");
    return;
  }

  const endpoints = ['clients', 'contracts', 'workspaces', 'clauses'];
  
  for (const endpoint of endpoints) {
    console.log(`\n🔍 Checking endpoint: ${endpoint}`);
    try {
      const res = await fetch(`${url}/rest/v1/${endpoint}?limit=1`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });
      console.log(`Status: ${res.status}`);
      if (!res.ok) {
        console.log(`Error: ${await res.text()}`);
      } else {
        console.log(`Success: Data received.`);
      }
    } catch (err: any) {
      console.error(`Fetch exception: ${err.message}`);
    }
  }
}

diagnose();
