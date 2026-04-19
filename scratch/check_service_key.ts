import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

function getEnvKey(keyName: string) {
  const envPath = resolve(process.cwd(), '.env');
  if (existsSync(envPath)) {
    const envFile = readFileSync(envPath, 'utf8');
    for (const line of envFile.split(/\r?\n/)) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match && match[1] === keyName) {
        return (match[2] || '').replace(/^\"|\"$/g, '').trim();
      }
    }
  }
  return '';
}

const key = getEnvKey('SUPABASE_SERVICE_ROLE_KEY');
console.log('--- SUPABASE ENV DIAGNOSTIC ---');
console.log(`URL: ${getEnvKey('SUPABASE_URL')}`);
console.log(`SERVICE_KEY_FOUND: ${key.length > 0}`);
console.log(`SERVICE_KEY_PREFIX: ${key.substring(0, 10)}...`);
console.log(`SERVICE_KEY_LEN: ${key.length}`);
