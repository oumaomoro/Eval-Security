import { storage } from "../storage.js";
import { storageContext } from "./storageContext.js";
import { adminClient } from "./supabase.js";
import { SOC2Logger } from "./SOC2Logger.js";

/**
 * QUEUE SERVICE PRO — Persistent Database-Backed Queue
 * ══════════════════════════════════════════════════
 * Replaces the in-memory queue with a robust, DB-backed task engine.
 * Ensures tasks survive server restarts and allows for distributed workers.
 */
export class QueueService_Pro {
  private static isPolling = false;
  private static pollInterval: NodeJS.Timeout | null = null;

  /**
   * Start the background worker poll.
   */
  static startWorker() {
    if (this.isPolling) return;
    this.isPolling = true;
    console.log("[WORKER] 🚀 Persistent Job Worker started.");
    
    this.pollInterval = setInterval(() => this.poll(), 5000); // Poll every 5 seconds
  }

  /**
   * Stop the background worker.
   */
  static stopWorker() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.isPolling = false;
  }

  /**
   * Enqueue a new persistent job.
   */
  static async enqueue(type: string, payload: any, workspaceId: number): Promise<number> {
    const job = await storage.createJob({
      workspaceId,
      type,
      payload,
      status: "pending",
      attempts: 0,
      maxAttempts: 3
    });
    console.log(`[QUEUE] 📥 Persisted Job #${job.id} (${type}) for Workspace ${workspaceId}`);
    return job.id;
  }

  /**
   * Poll and execute pending jobs.
   */
  private static async poll() {
    try {
      // 1. Fetch one pending job and lock it
      const job = await storage.claimNextJob();
      if (!job) return;

      console.log(`[WORKER] 🛠️  Processing Job #${job.id} (${job.type})...`);

      // 2. Execute within Workspace Context
      await storageContext.run({ client: adminClient, workspaceId: job.workspaceId }, async () => {
        try {
          await this.executeJob(job);
          await storage.updateJob(job.id, { 
            status: "completed", 
            completedAt: new Date() 
          });
          console.log(`[WORKER] ✅ Job #${job.id} completed.`);
        } catch (error: any) {
          console.error(`[WORKER] ❌ Job #${job.id} failed:`, error.message);
          
          const nextAttempt = (job.attempts || 0) + 1;
          const isFinalFailure = nextAttempt >= (job.maxAttempts || 3);
          
          await storage.updateJob(job.id, {
            status: isFinalFailure ? "failed" : "pending",
            attempts: nextAttempt,
            lastError: error.message,
            lockedAt: null // Release for retry if not final
          });

          if (isFinalFailure) {
            await SOC2Logger.logEvent({ user: { id: "SYSTEM" } } as any, {
              action: "JOB_FAILURE_CRITICAL",
              userId: "SYSTEM",
              resourceType: "Job",
              resourceId: String(job.id),
              details: `Persistent job ${job.type} failed permanently after ${nextAttempt} attempts: ${error.message}`
            });
          }
        }
      });
    } catch (err: any) {
      console.error("[WORKER] Polling cycle error:", err.message);
    }
  }

  /**
   * Job Dispatcher: Routes job types to their respective services.
   */
  private static async executeJob(job: any) {
    const { type, payload, workspaceId } = job;

    switch (type) {
      case "contract_analysis":
        // Dynamically import to avoid circular deps
        const { IntelligenceGateway } = await import("./IntelligenceGateway.js");
        const { storage: storageLayer } = await import("../storage.js");
        
        // This would call the same logic previously in routes.ts
        // but now safe in a background worker
        console.log(`[WORKER] Analyzing contract ${payload.contractId}`);
        // ... execution logic ...
        break;

      case "report_generation":
        const { ReportService } = await import("./ReportService.js");
        await ReportService.generateReport(workspaceId, payload.type, payload.filters);
        break;

      case "compliance_audit":
        const { AuditService } = await import("./AuditService.js");
        await AuditService.runAudit(payload.scope, workspaceId);
        break;

      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  }
}
