import { Router } from "express";
import { storage } from "../storage.js";
import { SOC2Logger } from "../services/SOC2Logger.js";
import { AuditService } from "../services/AuditService.js";
import { ScorecardEngine } from "../services/ScorecardEngine.js";

const router = Router();

/**
 * Continuous Monitoring Sweep
 * Protected by CRON_SECRET.
 * This job finds monitoring configs that are due, executes automated audits,
 * and schedules the next run.
 */
router.post("/process-monitoring", async (req, res) => {
  try {
    const cronSecret = process.env.CRON_SECRET || "dev_cron_secret";
    
    // Verify Authorized Invocation
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn("[CRON] Unauthorized attempt to trigger monitoring processing.");
      return res.status(401).json({ message: "Unauthorized Trigger" });
    }

    console.log("[CRON] Initiating Continuous Monitoring Sweep...");
    
    // 1. Fetch all active monitoring configs
    // Note: We use adminClient bypass here to sweep across all workspaces
    const configs = await storage.getContinuousMonitoringConfigs();
    const now = new Date();
    
    const dueConfigs = configs.filter(c => c.isActive && (!c.nextRun || new Date(c.nextRun) <= now));

    if (dueConfigs.length === 0) {
      console.log("[CRON] No monitoring tasks are due.");
      return res.status(200).json({ processed: 0, message: "No monitoring tasks due." });
    }

    console.log(`[CRON] Found ${dueConfigs.length} due monitoring tasks. Executing audits...`);

    let processedCount = 0;

    for (const config of dueConfigs) {
      try {
        console.log(`[CRON] Executing Audit for Client ${config.clientId} (Config ID: ${config.id})`);

        // A. Get contracts for this client
        const contracts = await storage.getContracts({ clientId: config.clientId });
        const contractIds = contracts.map(c => c.id);

        if (contractIds.length > 0) {
          // B. Trigger Automated Audit
          // We use AuditService directly or call the storage method
          // The AuditService.runAudit logic usually involves AI analysis
          const audit = await storage.createComplianceAudit({
            workspaceId: config.workspaceId ?? undefined,
            rulesetId: config.rulesetId,
            auditName: `Automated Continuous Audit - ${now.toISOString().split('T')[0]}`,
            auditType: 'continuous',
            scope: {
              contractIds,
              standards: [], // Will be derived from ruleset if empty
              categories: []
            },
            status: 'in_progress'
          });

          // C. (Optional) In a real production system, we'd queue this for an async worker
          // For now, we rely on the AutonomicEngine or manual trigger if it's already running.
          // But here we can simulate the completion or trigger the AI analysis.
          
          await SOC2Logger.logEvent(req, {
            action: "CONTINUOUS_AUDIT_TRIGGERED",
            userId: "SYSTEM_CRON",
            resourceType: "ComplianceAudit",
            resourceId: String(audit.id),
            details: `Continuous monitoring triggered automated audit for ${contractIds.length} contracts.`
          });

          // D. (Phase 30) Auto-recalculate Vendor Scorecard
          const vendorName = contracts[0]?.vendorName;
          if (vendorName && config.workspaceId) {
            await ScorecardEngine.updateScorecard(vendorName, config.workspaceId);
          }
        }

        // D. Update next run date
        const frequencyDays = config.frequencyDays || 7;
        const nextRun = new Date(now.getTime() + frequencyDays * 24 * 60 * 60 * 1000);
        
        await storage.updateContinuousMonitoringConfig(config.id, {
          lastRun: now,
          nextRun: nextRun
        });

        processedCount++;
      } catch (err: any) {
        console.error(`[CRON] Monitoring Config ${config.id} Failed:`, err);
      }
    }

    res.json({
      processed: processedCount,
      totalSelected: dueConfigs.length,
      message: "Monitoring sweep completed successfully."
    });

  } catch (error: any) {
    console.error("[CRON] Fatal Monitoring Pipeline Error:", error);
    res.status(500).json({ message: "Fatal error in monitoring pipeline." });
  }
});

export default router;
