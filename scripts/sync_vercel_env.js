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
  'DATABASE_URL',
  'JWT_SECRET',
  'FRONTEND_URL',
  'OPENAI_API_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_API_TOKEN',
  'RESEND_API_KEY',
  'SIGNNOW_API_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'PAYPAL_CLIENT_ID',
  'PAYPAL_SECRET'
];

// Clean VERCEL_TOKEN from process.env to avoid hijacking local CLI session
delete process.env.VERCEL_TOKEN;

const projects = [
  { id: 'cyberoptimize-frontend', path: '.' },
  { id: 'prj_pWdvodBRU6wg1mFFMGDHIx9KD6SJ', path: 'cyberoptimize-prod/backend' }
];

const targetEnv = 'production';

projects.forEach(project => {
  console.log(`\n🏢 Syncing Project: ${project.id}...`);
  vars.forEach(v => {
    let value = process.env[v];
    
    // Map mismatched keys if necessary
    if (!value && v === 'UPSTASH_REDIS_REST_URL') value = process.env['UPSTASH_REDIS_URL'];
    if (!value && v === 'CLOUDFLARE_API_TOKEN') value = process.env['CLOUDFLARE_API_KEY'];

    if (value) {
      console.log(`📡 Syncing ${v} to ${project.id}...`);
      try {
        const vercelFlags = `--cwd ${project.path}`;
        
        // Remove existing to avoid conflict
        try {
          execSync(`vercel env rm ${v} ${targetEnv} -y ${vercelFlags}`, { stdio: 'ignore' });
        } catch (e) {}
        
        // Add new value using a temp file to avoid echo newlines
        const tmpFile = path.resolve(process.cwd(), `tmp_${v}.txt`);
        fs.writeFileSync(tmpFile, value.trim());
        
        execSync(`vercel env add ${v} ${targetEnv} ${vercelFlags} < "${tmpFile}"`, { stdio: 'inherit' });
        
        // Clean up
        try { fs.unlinkSync(tmpFile); } catch (e) {}
      } catch (err) {
        console.error(`❌ Failed to sync ${v}:`, err.message);
      }
    } else {
      console.log(`🛑 Skipping ${v}: Not found in local .env`);
    }
  });
});

console.log('\n✅ Multi-Project Sync Complete.');
