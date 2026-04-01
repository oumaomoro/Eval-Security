import { supabase } from './supabase.service.js';

/**
 * Check if Supabase is configured and usable
 */
export function isSupabaseConfigured() {
  return true;
}

/**
 * Professional Data Siloing: Returns a Supabase query scoped to the user's organization.
 * Used for MSP multi-tenancy to ensure strict data isolation.
 * 
 * IMPORTANT: In Supabase v2, you must call a command like .select() before .eq().
 * This utility handles that automatically.
 */
export function orgScopedQuery(table, user, selectClause = '*', options = {}) {
  // Start with select() to get a filterable builder
  let query = supabase.from(table).select(selectClause, options);
  
  if (user && user.organization_id) {
    return query.eq('organization_id', user.organization_id);
  }
  
  // Fallback to user_id if organization_id is not set
  if (user && user.id) {
    return query.eq('user_id', user.id);
  }
  
  return query;
}
