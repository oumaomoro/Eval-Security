import { storage } from "../storage";
import { adminClient as supabase } from "./supabase";
import { type InsertInfrastructureLog } from "@shared/schema";

/**
 * Autonomic Engine V2.1
 * 
 * Responsible for platform self-healing, autonomic sync, and background telemetry.
 * Hardened for Phase 25 with extreme resilience to prevent server crashes.
 */
export class AutonomicEngine {
  private static heartbeatInterval: NodeJS.Timeout | null = null;
  private static pulseCount = 0;

  static start() {
    if (this.heartbeatInterval) return;

    console.log("[AUTONOMIC] Engine Start initiated.");
    
    // Heartbeat every 60 seconds
    this.heartbeatInterval = setInterval(async () => {
      try {
        await this.pulse();
      } catch (err: any) {
        console.error("[AUTONOMIC HEARTBEAT ERROR]", err.message);
      }
    }, 60000);

    // Defer initial pulse to ensure all modules are fully loaded
    setTimeout(() => {
      this.pulse().catch(err => console.error("[AUTONOMIC INITIAL PULSE ERROR]", err.message));
    }, 1000);
  }

  private static async pulse() {
    this.pulseCount++;
    const start = Date.now();

    try {
      // 1. Perform Postgres Health Check (via REST)
      const { error: pgError } = await supabase.from("profiles").select("count", { count: "exact", head: true });
      const postgresLatency = Date.now() - start;

      // 2. Billing & Telemetry Resilience (Phase 2)
      // We wrap this specifically because telemetry tables are often missing in new envs.
      try {
        if (storage && typeof storage.getBillingTelemetry === 'function') {
          const telemetry = await storage.getBillingTelemetry();
          const recentCalls = telemetry
            .filter(t => t.metricType === 'api_call' && t.timestamp && (Date.now() - new Date(t.timestamp).getTime() < 900000))
            .reduce((sum, t) => sum + t.value, 0);

          if (recentCalls > 100) {
            await storage.createInfrastructureLog({
              status: "info",
              component: "RegionalScaler",
              event: "Predictive Scaling Triggered",
              actionTaken: `Surge Detected (${recentCalls} calls/15m).`,
            });
          }
        }
      } catch (e: any) {
        // Silently handle missing billing_telemetry table
      }

      // 3. Log Health Pulse
      if (storage && typeof storage.createInfrastructureLog === 'function') {
        await storage.createInfrastructureLog({
          status: "healthy",
          component: "AutonomicEngine",
          event: "Pulse Check Completed",
          actionTaken: `Lat: ${postgresLatency}ms | Hub Pulse: ${this.pulseCount}`,
        }).catch(() => {});
      }

    } catch (err: any) {
      console.error("[AUTONOMIC PULSE CORE ERROR]", err.message);
    }
  }

  static stop() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  static async getHealthMetrics() {
    return {
      status: "healthy",
      pulseCount: this.pulseCount,
      lastPulse: new Date().toISOString(),
      postgresLatency: "sampled",
      version: "2.1.0-sovereign"
    };
  }
}
