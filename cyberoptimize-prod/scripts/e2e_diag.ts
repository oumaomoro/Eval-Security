import { readFileSync } from 'fs';
import { resolve } from 'path';

try {
  const envPath = resolve(process.cwd(), ".env");
  const envFile = readFileSync(envPath, "utf-8");
  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
    if (match && !process.env[match[1]]) {
      let val = (match[2] || "").trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      process.env[match[1]] = val;
    }
  }
} catch { /* ok */ }

import('@supabase/supabase-js').then(({ createClient }) => {
  const SUPABASE_URL = process.env.SUPABASE_URL!;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const ANON_KEY = process.env.SUPABASE_ANON_KEY || SERVICE_KEY;

  console.log('SUPABASE_URL:', SUPABASE_URL ? '✅ set' : '❌ missing');
  console.log('SERVICE_KEY:', SERVICE_KEY ? '✅ set' : '❌ missing');
  console.log('ANON_KEY:', ANON_KEY ? '✅ set' : '❌ missing');

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing env vars. Exiting.');
    process.exit(1);
  }

  (async () => {
    const API = 'http://127.0.0.1:3001/api';

    // Step 1 - server health
    console.log('\n[1] Pinging /api/health...');
    try {
      const r = await fetch(`${API}/health`);
      const t = await r.text();
      console.log(`    Status: ${r.status} | Body: ${t.substring(0, 200)}`);
    } catch (e: any) {
      console.error('    FETCH ERROR:', e.message);
    }

    // Step 2 - create user
    console.log('\n[2] Creating admin test user via Supabase...');
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const uid = Math.random().toString(36).slice(2, 8);
    const email = `diag_${uid}@cyberoptimize.test`;
    const { data: ud, error: ue } = await admin.auth.admin.createUser({
      email, password: 'Password123!', email_confirm: true,
      user_metadata: { first_name: 'Diag', last_name: 'Bot' }
    });
    if (ue) { console.error('    CREATE USER ERROR:', ue.message); process.exit(1); }
    console.log('    User created:', ud.user.id);

    // Step 3 - sign in with anon key
    console.log('\n[3] Signing in with anon key...');
    const anon = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    const { data: sd, error: se } = await anon.auth.signInWithPassword({ email, password: 'Password123!' });
    if (se || !sd.session) { console.error('    SIGN IN ERROR:', se?.message); process.exit(1); }
    const token = sd.session.access_token;
    console.log('    Token prefix:', token.substring(0, 30) + '...');

    // Step 4 - hit auth/login
    console.log('\n[4] Hitting /api/auth/login with Bearer token...');
    try {
      const r = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'Password123!' })
      });
      const t2 = await r.text();
      console.log(`    Status: ${r.status} | Body: ${t2.substring(0, 300)}`);
    } catch (e: any) {
      console.error('    FETCH ERROR:', e.message);
    }

    // Step 5 - hit org/members
    console.log('\n[5] Hitting /api/org/members with Bearer token...');
    try {
      const r = await fetch(`${API}/org/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const t3 = await r.text();
      console.log(`    Status: ${r.status} | Body: ${t3.substring(0, 300)}`);
    } catch (e: any) {
      console.error('    FETCH ERROR:', e.message);
    }

    // Cleanup
    console.log('\n[6] Cleaning up user...');
    await admin.auth.admin.deleteUser(ud.user.id);
    console.log('    Done.');
    process.exit(0);
  })().catch(err => {
    console.error('\nUNHANDLED:', err.message, err.stack);
    process.exit(1);
  });
});
