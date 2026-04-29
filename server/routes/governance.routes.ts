import { Router } from "express";
import { isAuthenticated } from "../replit_integrations/auth/index.js";
import { GovernanceOrchestrator } from "../services/GovernanceOrchestrator.js";
import { SOC2Logger } from "../services/SOC2Logger.js";

const governanceRouter = Router();

/**
 * Trigger a full governance scan.
 */
governanceRouter.post("/api/governance/scan", isAuthenticated, async (req: any, res) => {
  try {
    const result = await GovernanceOrchestrator.runFullGovernanceScan(req.user.workspaceId);
    
    await SOC2Logger.logEvent(req, {
      action: "FULL_GOVERNANCE_SCAN_TRIGGERED",
      userId: req.user.id,
      details: "User initiated a comprehensive contract and infrastructure governance scan."
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Get Sovereign Health Report summary.
 */
governanceRouter.get("/api/governance/health-report", isAuthenticated, async (req: any, res) => {
  try {
    const report = await GovernanceOrchestrator.generateSovereignHealthReport(req.user.workspaceId);
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default governanceRouter;
