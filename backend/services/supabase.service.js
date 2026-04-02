import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}


const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();
const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Priority: Service Role (for Admin SDK) > Anon
const supabaseKey = serviceRoleKey || anonKey;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase] Missing configuration. Auth and DB features will be degraded.');
}

export const supabase = createClient(supabaseUrl || 'https://missing-url.supabase.co', supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    headers: { 'x-application-name': 'costloci-backend' }
  }
});

export const isSupabaseConfigured = () => {
  return !!supabaseUrl && supabaseUrl !== 'https://missing-url.supabase.co';
};

export default supabase;

