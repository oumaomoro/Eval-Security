import { storage } from "../storage";
import { type InsertAuditLog } from "@shared/schema";
import { Request } from "express";
import { NotificationService } from "./NotificationService";

/**
 * SOC-2 Compliance Audit Logger
 * 
 * Formalizes the enterprise audit trail by standardizing the capture
 * of administrative and security events. Extracts proxy-aware IP geometry
 * and persists to the immutable `audit_logs` storage layer.
 */
export class SOC2Logger {
  static async logEvent(
    req: Request,
    eventData: {
      userId: string;
      action: string;
      workspaceId?: number;
      clientId?: number;
      resourceType?: string;
      resourceId?: string;
      details?: string;
      metadata?: any;
    }
  ) {
    try {
      // Extract IP (handling Cloudflare/Vercel proxies if present)
      const ipAddress = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").toString().split(",")[0].trim();
      
      const log: InsertAuditLog = {
        userId: eventData.userId,
        action: eventData.action,
        workspaceId: eventData.workspaceId,
        clientId: eventData.clientId,
        resourceType: eventData.resourceType,
        resourceId: eventData.resourceId,
        details: eventData.details,
        ipAddress: ipAddress,
        metadata: eventData.metadata,
      };

      storage.createAuditLog(log).catch(err => {
         console.error("[SOC-2 Logger] Database persistence failed:", err);
      });

      // ── REAL-TIME GOVERNANCE BROADCAST (Phase 32) ─────────
      // Automatically alert stakeholders for mission-critical events.
      const criticalActions = [
        "AUTHENTICATION_SUCCESS",
        "SSO_SESSION_ESTABLISHED",
        "SUBSCRIPTION_UPGRADE",
        "SECURITY_ALERT",
        "USER_INVITED"
      ];

      if (criticalActions.includes(eventData.action)) {
        NotificationService.broadcastEvent(eventData.workspaceId || 1, "compliance_alert", {
          title: `Critical Governance Event: ${eventData.action}`,
          message: eventData.details || `Administrative mutation detected on resource ${eventData.resourceType}:${eventData.resourceId}`,
          severity: "info"
        }).catch(() => {});
      }
      
    } catch (err) {
      console.error("[SOC-2 Logger] Critical event generation failure:", err);
    }
  }
}
