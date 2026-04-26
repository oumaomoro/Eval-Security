import { Router } from "express";
import { storage } from "../storage.js";
import { isAuthenticated } from "../replit_integrations/auth/index.js";
import { SOC2Logger } from "../services/SOC2Logger.js";

const router = Router();

/**
 * POST /api/collaboration/presence
 * Heartbeat for a user viewing a specific resource.
 */
router.post("/collaboration/presence", isAuthenticated, async (req: any, res) => {
  try {
    const { resourceType, resourceId } = req.body;
    if (!resourceType || !resourceId) {
      return res.status(400).json({ message: "Resource type and ID are required." });
    }

    await storage.upsertPresence({
      workspaceId: req.workspaceId,
      userId: req.user.id,
      resourceType,
      resourceId: String(resourceId)
    });

    res.status(204).end();
  } catch (error: any) {
    res.status(500).json({ message: "Presence heartbeat failed." });
  }
});

/**
 * GET /api/collaboration/presence/:resourceType/:resourceId
 * Fetches active users on a specific resource.
 */
router.get("/collaboration/presence/:resourceType/:resourceId", isAuthenticated, async (req: any, res) => {
  try {
    const { resourceType, resourceId } = req.params;
    const activeUsers = await storage.getActivePresence(
      req.workspaceId,
      resourceType,
      resourceId
    );

    res.json(activeUsers);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch active users." });
  }
});

/**
 * GET /api/collaboration/activity
 * Recent team activity in the current workspace.
 */
router.get("/collaboration/activity", isAuthenticated, async (req: any, res) => {
  try {
    const logs = await storage.getAuditLogs(undefined, undefined);
    // Filter/map to a clean activity feed
    const activity = logs.slice(0, 20).map(l => ({
      id: l.id,
      user: l.userId, // In a real app, join with profile
      action: l.action,
      resource: l.resourceType,
      timestamp: l.timestamp,
      details: l.details
    }));

    res.json(activity);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch activity feed." });
  }
});

export default router;
