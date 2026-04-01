import { supabase } from './supabase.service.js';
import { isSupabaseConfigured } from './db.utils.js';

/**
 * Phase 11.3: Immutable Audit Logging for SOC 2 Readiness
 * Records critical user actions representing a Chain of Custody for data privacy compliance.
 */
export async function logAuditAction(userId, contractId, actionType, description, req) {
  try {
    const logEntry = {
      user_id: userId,
      contract_id: contractId,
      action_type: actionType,
      description: description,
      ip_address: req?.ip || req?.headers?.['x-forwarded-for'] || '127.0.0.1'
    };

    if (isSupabaseConfigured()) {
      await supabase.from('audit_logs').insert([logEntry]);
    } else {
      console.log(`[AUDIT MOCK] [${actionType}] Contract: ${contractId} | User: ${userId} | ${description}`);
    }
  } catch (err) {
    console.error('[Audit Logger Error]', err.message);
    // Deliberately not throwing so the main flow isn't blocked by telemetry failures
  }
}
