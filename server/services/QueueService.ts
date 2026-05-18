import pRetry from "p-retry";
import pLimit from "p-limit";
import { storageContext } from "./storageContext.js";
import { adminClient } from "./supabase.js";

// ─── Types ────────────────────────────────────────────────────────────────────

type JobFn = () => Promise<void>;

interface JobConfig {
  /** Human-readable label for logging / dead-letter identification */
  label: string;
  /** Max retry attempts after the first failure (default: 3) */
  retries?: number;
  /** Minimum backoff in ms between retries (default: 1000) */
  minTimeout?: number;
  /** Workspace context to restore during background execution */
  workspaceId?: number;
}

// ─── QueueService ─────────────────────────────────────────────────────────────

/**
 * COSTLOCI ENTERPRISE — Lightweight Async Job Queue
 * ══════════════════════════════════════════════════
 * Fire-and-forget queue with automatic retry semantics and concurrency limits.
 * Now Workspace-Aware to preserve multi-tenant context in background jobs.
 */
export class QueueService {
  private static readonly DEFAULT_RETRIES = 3;
  private static readonly DEFAULT_MIN_TIMEOUT_MS = 1_000;
  
  // Enterprise Guard: Limit concurrent background jobs to prevent DB/AI exhaustion
  // Scalable via QUEUE_CONCURRENCY environment variable (default: 5)
  private static readonly limit = pLimit(Number(process.env.QUEUE_CONCURRENCY) || 5);

  /**
   * Enqueue an arbitrary async job with automatic retry on failure.
   */
  static enqueue(fn: JobFn, config: JobConfig): void {
    const {
      label,
      retries = QueueService.DEFAULT_RETRIES,
      minTimeout = QueueService.DEFAULT_MIN_TIMEOUT_MS,
      workspaceId = storageContext.getStore()?.workspaceId
    } = config;

    const jobId = `${label}::${Date.now()}`;
    console.log(`[QUEUE] 📥 Enqueued: ${jobId} (Workspace: ${workspaceId || 'Global'})`);

    // Fire-and-forget within concurrency limits
    this.limit(() => 
      pRetry(
        async (attempt) => {
          if (attempt > 1) {
            console.log(`[QUEUE] 🔄 Retry ${attempt - 1}/${retries}: ${jobId}`);
          }
          
          // Restore Workspace Context before execution
          return storageContext.run({ client: adminClient, workspaceId }, async () => {
             await fn();
          });
        },
        {
          retries,
          minTimeout,
          factor: 2,
          randomize: true,
          onFailedAttempt: (err: any) => {
            console.warn(
              `[QUEUE] ⚠️  Attempt ${(err.attemptNumber as number)}/${retries + 1} failed for ${jobId}: ${err.message}`
            );
          },
        }
      )
    ).then(() => {
      console.log(`[QUEUE] ✅ Completed: ${jobId}`);
    }).catch((err) => {
      console.error(`[QUEUE] 💀 Dead-letter — job ${jobId} failed permanently:`, err.message);
    });
  }

  /**
   * Convenience wrapper: enqueue an email send job.
   */
  static enqueueEmail(
    sendFn: () => Promise<boolean>,
    to: string,
    subject: string
  ): void {
    const workspaceId = storageContext.getStore()?.workspaceId;
    this.enqueue(
      async () => {
        const sent = await sendFn();
        if (!sent) {
          throw new Error(`Email delivery returned false for ${to}`);
        }
      },
      {
        label: `email::${to}::${subject.slice(0, 30)}`,
        retries: QueueService.DEFAULT_RETRIES,
        minTimeout: 1_500,
        workspaceId
      }
    );
  }
}
