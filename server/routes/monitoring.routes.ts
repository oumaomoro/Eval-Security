import { Router } from "express";
import { storage } from "../storage.js";
import { isAuthenticated } from "../replit_integrations/auth/index.js";
import { SOC2Logger } from "../services/SOC2Logger.js";
import { insertContinuousMonitoringSchema } from "../../shared/schema.js";

const router = Router();

/**
 * GET /api/compliance/monitoring
 * List all continuous monitoring configurations for the workspace.
 */
router.get("/compliance/monitoring", isAuthenticated, async (req: any, res) => {
  try {
    const workspaceId = req.workspaceId;
    if (!workspaceId) return res.status(400).json({ message: "Workspace context missing" });

    const configs = await storage.getContinuousMonitoringConfigs();
    // Storage engine filters by workspaceId internally using AsyncLocalStorage context
    res.json(configs);
  } catch (error: any) {
    console.error("[MONITORING API ERROR]", error.message);
    res.status(500).json({ message: "Failed to fetch monitoring configurations." });
  }
});

/**
 * POST /api/compliance/monitoring
 * Create a new continuous monitoring configuration.
 */
router.post("/compliance/monitoring", isAuthenticated, async (req: any, res) => {
  try {
    const workspaceId = req.workspaceId;
    if (!workspaceId) return res.status(400).json({ message: "Workspace context missing" });

    const result = insertContinuousMonitoringSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid configuration data", errors: result.error.errors });
    }

    const config = await storage.createContinuousMonitoringConfig({
      ...result.data,
      workspaceId
    });

    await SOC2Logger.logEvent(req, {
      action: "MONITORING_CONFIG_CREATED",
      userId: req.user.id,
      resourceType: "ContinuousMonitoring",
      resourceId: String(config.id),
      details: `Started continuous monitoring for client ${config.clientId} using ruleset ${config.rulesetId}`
    });

    res.status(201).json(config);
  } catch (error: any) {
    console.error("[MONITORING API ERROR]", error.message);
    res.status(500).json({ message: "Failed to create monitoring configuration." });
  }
});

/**
 * PATCH /api/compliance/monitoring/:id
 * Update an existing monitoring configuration (e.g., toggle active status).
 */
router.patch("/compliance/monitoring/:id", isAuthenticated, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid configuration ID" });

    const config = await storage.updateContinuousMonitoringConfig(id, req.body);

    await SOC2Logger.logEvent(req, {
      action: "MONITORING_CONFIG_UPDATED",
      userId: req.user.id,
      resourceType: "ContinuousMonitoring",
      resourceId: String(config.id),
      details: `Updated monitoring configuration status: ${config.isActive ? 'Active' : 'Paused'}`
    });

    res.json(config);
  } catch (error: any) {
    console.error("[MONITORING API ERROR]", error.message);
    res.status(500).json({ message: "Failed to update monitoring configuration." });
  }
});

export default router;
