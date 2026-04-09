import fs from 'fs';
import path from 'path';

const mode = process.argv[2] === 'sandbox' ? 'sandbox' : 'live';
const isLive = mode === 'live';

const domains = {
  sandbox: 'https://api-m.sandbox.paypal.com',
  live: 'https://api-m.paypal.com'
};

const BASE_DIR = process.cwd();
const ENV_FILES = ['.env', '.env.production', '.env.vercel.production'];

console.log(`[PayPal Automator] Provisioning ${mode.toUpperCase()} Environment...`);

let updateCount = 0;

for (const filename of ENV_FILES) {
  const filePath = path.join(BASE_DIR, filename);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // Swap BASE_URL
  if (content.match(/PAYPAL_BASE_URL=.*$/m)) {
    content = content.replace(/PAYPAL_BASE_URL=.*$/m, `PAYPAL_BASE_URL=${domains[mode]}`);
  } else {
    content += `\nPAYPAL_BASE_URL=${domains[mode]}\n`;
  }

  // Swap MODE
  if (content.match(/PAYPAL_MODE=.*$/m)) {
    content = content.replace(/PAYPAL_MODE=.*$/m, `PAYPAL_MODE=${mode}`);
  } else {
    content += `PAYPAL_MODE=${mode}\n`;
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(` ✅ Injected ${mode.toUpperCase()} routing into ${filename}`);
    updateCount++;
  }
}

if (updateCount > 0) {
  console.log(`\n🎉 Success! The platform is now configured for PayPal ${mode.toUpperCase()}.`);
  console.log('❗️ Reminder: Ensure your .env contains the matching Client ID and Secret for this mode.');
  if (isLive) {
    console.log('💡 To deploy these variables to Vercel instantly, run: vercel env pull && vercel env push --yes');
  }
} else {
  console.log('⚠️ No target environment files found or modified.');
}
