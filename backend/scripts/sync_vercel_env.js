/**
 * Costloci: Vercel Environment Synchronizer
 * Uses stdin piping to avoid interactive prompts.
 * Usage: node scripts/sync_vercel_env.js
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found. Ensure you are in the backend directory.');
  process.exit(1);
}

const envConfig = dotenv.parse(fs.readFileSync(envPath));

const CRITICAL_KEYS = [
  'PAYPAL_CLIENT_ID',
  'PAYPAL_CLIENT_SECRET',
  'PAYPAL_MODE',
  'PAYPAL_BASE_URL',
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

console.log('🚀 Starting Vercel Environment Synchronization...');

let synced = 0;
let skipped = 0;

for (const key of CRITICAL_KEYS) {
  const value = envConfig[key]?.trim(); // Ensure no accidental whitespace
  if (!value) {
    console.warn(`🛑 Skipping ${key}: Not found in local .env`);
    skipped++;
    continue;
  }
  console.log(`📡 Syncing ${key}...`);
  try {
    // Pass value via 'input' option instead of shell echo to avoid newlines (\r\n)
    execSync(`vercel env add ${key} production --force`, {
      input: value,
      stdio: ['pipe', 'inherit', 'inherit']
    });
    synced++;
  } catch (err) {
    console.warn(`⚠️  Failed to sync ${key}:`, err.message?.split('\n')[0]);
  }
}

console.log(`\n✅ Sync Complete: ${synced} synced, ${skipped} skipped.`);
