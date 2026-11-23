import { Router } from "express";
import { storage } from "../storage.js";
import { isAuthenticated } from "../replit_integrations/auth/index.js";

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
 workspaceId: req.user.workspaceId, // FIXED: was req.workspaceId (always undefined)
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
 req.user.workspaceId, // FIXED: was req.workspaceId (always undefined)
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
 * storageContext is set by the auth middleware so getAuditLogs()
 * automatically scopes to the calling user's workspace.
 */
router.get("/collaboration/activity", isAuthenticated, async (req: any, res) => {
 try {
 // FIXED: removed explicit (undefined, undefined) args that bypassed workspace filter
 const logs = await storage.getAuditLogs();
 const activity = logs.slice(0, 20).map((l: any) => ({
 id: l.id,
 user: l.userId,
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
