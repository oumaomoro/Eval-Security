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
  
  if (!user) return query;

  // Primary Scoping: Organization Layer (Adaptive ID Mapping)
  if (user.organization_id || user.client_id) {
    // Detect ID Type requirements for the target table
    // Tables using numeric 'client_id' (Integer)
    const numericTables = ['contracts', 'billing_telemetry', 'workspaces', 'risks', 'savings_opportunities'];
    const scopingColumn = numericTables.includes(table) ? 'client_id' : 'organization_id';
    
    // For numeric tables, if we have client_id, use it. Otherwise fallback to organization_id if it's numeric (Legacy)
    const idToUse = numericTables.includes(table) 
        ? (user.client_id || user.organization_id)
        : (user.organization_id || user.client_id);

    // Ensure we don't try to compare a UUID string with an Integer ID column
    if (numericTables.includes(table) && typeof idToUse === 'string' && idToUse.includes('-')) {
        console.warn(`[Scoper] Type Mismatch Warning: Attempting to use UUID on numeric table ${table}. Scoping by user_id instead.`);
        return query.eq('user_id', user.id);
    }

    return query.eq(scopingColumn, idToUse);
  }
  
  // Secondary Scoping: Personal Layer (Fallback)
  if (user.id) {
    return query.eq('user_id', user.id);
  }
  
  return query;
}
