import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Universal CyberOptimize Cloud Deployment...');

const run = (cmd, cwd) => {
    try {
        console.log(`📡 Executing: ${cmd} in ${cwd || 'root'}`);
        execSync(cmd, { stdio: 'inherit', cwd: cwd || __dirname });
    } catch (err) {
        console.error(`❌ Command failed: ${cmd}`);
        process.exit(1);
    }
};

// 1. Sync Environment Variables
console.log('\n--- 1. Syncing Cloud Secrets ---');
run('node scripts/sync_vercel_env.js', path.join(__dirname, 'cyberoptimize-prod', 'backend'));

// 2. Deploy Hardened Backend
console.log('\n--- 2. Deploying Backend ---');
run('vercel --prod --yes', path.join(__dirname, 'cyberoptimize-prod', 'backend'));

// 3. Build & Deploy Frontend
console.log('\n--- 3. Deploying Frontend to Cloudflare ---');
run('npx wrangler pages deploy dist/public --project-name=costloci-frontend --branch=main', __dirname);

console.log('\n✅ MISSION COMPLETE: Platform is live and hardened.');
