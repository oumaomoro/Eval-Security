import { supabase } from './supabase.service.js';

/**
 * Phase 17: Hardened Audit Service — Always writes to Supabase.
 * Supabase is a required dependency in all environments.
 * The mock console.log fallback is removed; if Supabase fails, the error is logged
 * but the main flow is not interrupted.
 */
export async function logAuditAction(userId, contractId, actionType, description, req) {
  try {
    const logEntry = {
      user_id: userId,
      contract_id: contractId,
      action_type: actionType,
      description: description,
      ip_address: req?.ip || req?.headers?.['x-forwarded-for'] || 'unknown',
      organization_id: req?.user?.organization_id || null,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('audit_logs').insert([logEntry]);
    if (error) throw error;
  } catch (err) {
    // Don't throw — audit failures must never break the main request lifecycle.
    // However, we DO log them clearly for observability.
    console.error(`[AuditService] Failed to persist audit log [${actionType}]:`, err.message);
  }
}
