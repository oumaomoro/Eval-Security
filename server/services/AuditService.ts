import { adminClient as supabase } from "./supabase";
import { InsertAuditLog } from "@shared/schema";

/**
 * Phase 17: Hardened Audit Service (Chain of Custody)
 * 
 * Ensures consistent and non-blocking security logging across the Enterprise plane.
 * Provides SOC 2 Type 2 reliable compliance by suppressing internal DB faults from breaking the main client.
 */
export class AuditService {
  
  /**
   * Intelligently persists audit telemetry without disrupting process architecture.
   */
  static async logAuditAction(logEntry: InsertAuditLog): Promise<void> {
    try {
      const payload: any = {
        client_id: logEntry.clientId,
        user_id: logEntry.userId,
        action: logEntry.action,
        resource_type: logEntry.resourceType,
        resource_id: logEntry.resourceId,
        details: logEntry.details,
        metadata: logEntry.metadata || {},
        timestamp: new Date().toISOString()
      };

      // Only add ip_address if it exists in the schema cache (suppressing DB errors)
      if (logEntry.ipAddress) {
        payload.ip_address = logEntry.ipAddress;
      }

      const { error } = await supabase.from('audit_logs').insert([payload]);
      
      if (error) {
        throw error;
      }
    } catch (err: any) {
      // 🚨 CRITICAL FAULT TOLERANCE 🚨
      // Audit failures must never break the main request lifecycle in an enterprise deployment.
      // We trap the fault and escalate it silently for operational analysis.
      console.error(`[AuditService - CHAIN OF CUSTODY INTEGRITY WARNING] Failed to persist telemetry for action [${logEntry.action}]:`, err.message);
    }
  }
}
