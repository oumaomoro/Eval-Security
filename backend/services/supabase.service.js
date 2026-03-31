import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

// Use service role key if available (full DB access + bypasses RLS)
// Fall back to anon key for limited read access
const supabaseKey = (serviceRoleKey && serviceRoleKey !== 'YOUR_SERVICE_ROLE_KEY_FROM_SUPABASE_DASHBOARD')
  ? serviceRoleKey
  : anonKey;

if (!supabaseKey || supabaseKey === 'YOUR_SERVICE_ROLE_KEY_FROM_SUPABASE_DASHBOARD' || !supabaseUrl || supabaseUrl.includes('your-project-ref')) {
  console.error('❌ CRITICAL ERROR: Supabase is not configured. Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  console.error('Halting backend startup to prevent insecure deployment.');
  process.exit(1);
} else if (supabaseKey === anonKey) {
  console.warn('⚠️  Using Supabase ANON key — RLS applies. Add SERVICE_ROLE_KEY for full access.');
} else {
  console.log('✅ Supabase connected with service role key.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Check if Supabase is configured and usable
 * (Always true in production, as missing config now halts the server)
 */
export function isSupabaseConfigured() {
  return true;
}

/**
 * Professional Data Siloing: Returns a Supabase query scoped to the user's organization.
 * Used for MSP multi-tenancy to ensure strict data isolation.
 */
export function orgScopedQuery(table, user) {
  const query = supabase.from(table).select('*');
  if (user && user.organization_id) {
    return query.eq('organization_id', user.organization_id);
  }
  // Fallback to user_id if organization_id is not yet set (legacy support)
  return query.eq('user_id', user.id);
}

export default supabase;
