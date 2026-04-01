import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}


const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Use service role key if available (full DB access + bypasses RLS)
// Fall back to anon key for limited read access
const supabaseKey = (serviceRoleKey && serviceRoleKey !== 'YOUR_SERVICE_ROLE_KEY_FROM_SUPABASE_DASHBOARD')
  ? serviceRoleKey
  : (anonKey || 'MISSING_KEY');

if (!supabaseUrl) {
  console.warn('⚠️  Supabase URL is missing. Ensure SUPABASE_URL is set.');
} else {
  const isSvc = supabaseKey === serviceRoleKey;
  const obfuscatedUrl = supabaseUrl.replace(/(https:\/\/).*(.supabase.co)/, '$1***$2');
  console.log(`✅ Supabase context: ${isSvc ? 'Administrative' : 'Public'} | Endpoint: ${obfuscatedUrl}`);
}


export const supabase = createClient(supabaseUrl || 'https://missing-url.supabase.co', supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default supabase;

