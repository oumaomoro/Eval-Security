import { Router } from "express";
import { storage } from "../storage.js";
import { isAuthenticated } from "../replit_integrations/auth/index.js";
import { InfrastructureIntelligence } from "../services/InfrastructureIntelligence.js";
import { SOC2Logger } from "../services/SOC2Logger.js";
import { IaCScanner } from "../services/IaCScanner.js";
import { SelfHealingEngine } from "../services/SelfHealingEngine.js";

const infrastructureRouter = Router();

/**
 * List all cloud accounts for the workspace.
 */
infrastructureRouter.get("/api/infrastructure/accounts", isAuthenticated, async (req: any, res) => {
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
infrastructureRouter.post("/api/infrastructure/accounts", isAuthenticated, async (req: any, res) => {
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

    // Trigger initial discovery
    InfrastructureIntelligence.discoverAssets(account.id, req.user.workspaceId);

    res.status(201).json(account);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * List all assets for the workspace.
 */
infrastructureRouter.get("/api/infrastructure/assets", isAuthenticated, async (req: any, res) => {
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
infrastructureRouter.post("/api/infrastructure/assets/:id/analyze", isAuthenticated, async (req: any, res) => {
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
infrastructureRouter.post("/api/infrastructure/scan-iac", isAuthenticated, async (req: any, res) => {
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
infrastructureRouter.post("/api/infrastructure/remediate", isAuthenticated, async (req: any, res) => {
  try {
    const { assetName, assetType, issue } = req.body;
    const fix = await SelfHealingEngine.generateFix(assetName, assetType, issue);
    res.json(fix);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default infrastructureRouter;
