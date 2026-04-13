import { execSync } from 'child_process';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

console.log('🚀 Starting Vercel Environment Synchronization...');

const vars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'FRONTEND_URL',
  'OPENAI_API_KEY',
  'VERCEL_TOKEN',
  'UPSTASH_REDIS_URL',
  'UPSTASH_REDIS_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_API_KEY',
  'RESEND_API_KEY',
  'SIGNNOW_API_KEY',
  'SLACK_APP_ID',
  'SLACK_CLIENT_ID',
  'SLACK_SIGNING_SECRET',
  'SLACK_VERIFICATION_TOKEN',
  'CRON_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET'
];

const targetEnv = 'production';

vars.forEach(v => {
  const value = process.env[v];
  if (value) {
    console.log(`📡 Syncing ${v}...`);
    try {
      // Remove existing to avoid conflict
      try {
        execSync(`vercel env rm ${v} ${targetEnv} -y`, { stdio: 'ignore' });
      } catch (e) {}
      
      // Add new value
      const cmd = `echo "${value}" | vercel env add ${v} ${targetEnv}`;
      execSync(cmd, { stdio: 'inherit' });
    } catch (err) {
      console.error(`❌ Failed to sync ${v}:`, err.message);
    }
  } else {
    console.log(`🛑 Skipping ${v}: Not found in local .env`);
  }
});

console.log('\n✅ Sync Complete.');
