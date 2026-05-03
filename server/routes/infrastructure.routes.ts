import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth/index";
import { InfrastructureIntelligence } from "../services/InfrastructureIntelligence";
import { SOC2Logger } from "../services/SOC2Logger";
import { IaCScanner } from "../services/IaCScanner";
import { SelfHealingEngine } from "../services/SelfHealingEngine";
import { CloudSyncService } from "../services/CloudSyncService";
import { AutonomicEngine } from "../services/AutonomicEngine.js";

const infrastructureRouter = Router();

/**
 * GET /api/infrastructure/health
 * Returns high-fidelity technical metrics for the Sovereign Engine.
 */
infrastructureRouter.get("/infrastructure/health", isAuthenticated, async (req: any, res) => {
  try {
    const metrics = AutonomicEngine.getHealthMetrics();
    res.json(metrics);
  } catch (err: any) {
    res.status(500).json({ message: "Failed to fetch engine metrics." });
  }
});

/**
 * List all cloud accounts for the workspace.
 */
infrastructureRouter.get("/infrastructure/accounts", isAuthenticated, async (req: any, res) => {
  try {
    const accounts = await (storage as any).getCloudAccounts(req.user.workspaceId);
    res.json(accounts);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Register a new cloud account.
 */
infrastructureRouter.post("/infrastructure/accounts", isAuthenticated, async (req: any, res) => {
  try {
    const account = await (storage as any).createCloudAccount({
      ...req.body,
      workspaceId: req.user.workspaceId
    });
    
    await SOC2Logger.logEvent(req, {
      action: "CLOUD_ACCOUNT_REGISTERED",
      userId: req.user.id,
      details: `Registered ${req.body.provider} account: ${req.body.accountName}`
    });

    // Trigger initial discovery using the production sync service (Phase 34 Enhancement)
    CloudSyncService.syncAccount(account.id);

    res.status(201).json(account);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Force a sync for a specific account.
 */
infrastructureRouter.post("/infrastructure/accounts/:id/sync", isAuthenticated, async (req: any, res) => {
  try {
    const result = await CloudSyncService.syncAccount(parseInt(req.params.id));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * List all assets for the workspace.
 */
infrastructureRouter.get("/infrastructure/assets", isAuthenticated, async (req: any, res) => {
  try {
    const assets = await (storage as any).getInfrastructureAssets(req.user.workspaceId);
    res.json(assets);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Analyze a specific asset.
 */
infrastructureRouter.post("/infrastructure/assets/:id/analyze", isAuthenticated, async (req: any, res) => {
  try {
    const analysis = await InfrastructureIntelligence.analyzeAsset(parseInt(req.params.id));
    res.json({ analysis });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Scan IaC (Terraform/CloudFormation).
 */
infrastructureRouter.post("/infrastructure/scan-iac", isAuthenticated, async (req: any, res) => {
  try {
    const { content, fileName } = req.body;
    if (!content) return res.status(400).json({ error: "No content provided" });

    const findings = await IaCScanner.scanTerraform(content);

    await (storage as any).createInfrastructureLog({
      workspaceId: req.user.workspaceId,
      status: findings.length > 0 ? "detected" : "resolved",
      component: "IaCScanner",
      event: "Infrastructure-as-Code Analysis",
      actionTaken: `Scanned ${fileName || 'template'}. Found ${findings.length} issues.`
    });

    res.json({ findings });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Generate remediation fix for an asset.
 */
infrastructureRouter.post("/infrastructure/remediate", isAuthenticated, async (req: any, res) => {
  try {
    const { assetName, assetType, issue } = req.body;
    const fix = await SelfHealingEngine.generateFix(assetName, assetType, issue);
    res.json(fix);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/infrastructure/logs
 * List recent autonomic infrastructure events.
 */
infrastructureRouter.get("/infrastructure/logs", isAuthenticated, async (req: any, res) => {
  try {
    const logs = await storage.getInfrastructureLogs();
    res.json({ data: logs });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * POST /api/infrastructure/heal
 * Manually initiate a self-healing action for a specific event.
 */
infrastructureRouter.post("/infrastructure/heal", isAuthenticated, async (req: any, res) => {
  try {
    const { logId } = req.body;
    if (!logId) return res.status(400).json({ message: "Log ID required" });

    const log = await storage.updateInfrastructureLog(logId, { status: "healed" });

    await SOC2Logger.logEvent(req, {
      action: "MANUAL_SELF_HEALING",
      userId: req.user.id,
      details: `Admin manually healed infrastructure anomaly: ${log.event}`
    });

    res.json({ data: log });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default infrastructureRouter;
