import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth";
import { requireWorkspacePermission } from "../middleware/workspace-rbac";
import { z } from "zod";
import { SOC2Logger } from "../services/SOC2Logger";

const router = Router();

// GET /api/workspaces/:workspaceId/members
router.get("/api/workspaces/:workspaceId/members", isAuthenticated, requireWorkspacePermission('viewer'), async (req, res) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId as string);
    const members = await storage.getWorkspaceMembers(workspaceId);
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch workspace members" });
  }
});

// POST /api/workspaces/:workspaceId/members
router.post("/api/workspaces/:workspaceId/members", isAuthenticated, requireWorkspacePermission('admin'), async (req: any, res) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId as string);
    const { userId, role } = req.body;
    
    if (!userId || !role) {
      return res.status(400).json({ message: "userId and role are required" });
    }

    const member = await storage.addWorkspaceMember({
      userId,
      workspaceId,
      role
    });

    await SOC2Logger.logEvent(req, {
      userId: req.user.id,
      action: "WORKSPACE_MEMBER_ADDED",
      workspaceId,
      resourceType: "User",
      resourceId: userId,
      details: `Added user to workspace with role: ${role}`
    });
    
    res.status(201).json(member);
  } catch (error) {
    res.status(500).json({ message: "Failed to add member to workspace" });
  }
});

// PUT /api/workspaces/:workspaceId/members/:userId
router.put("/api/workspaces/:workspaceId/members/:userId", isAuthenticated, requireWorkspacePermission('admin'), async (req: any, res) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId as string);
    const userId = req.params.userId as string;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ message: "role is required" });
    }

    await storage.updateWorkspaceMemberRole(userId, workspaceId, role);

    await SOC2Logger.logEvent(req, {
      userId: req.user.id,
      action: "WORKSPACE_MEMBER_ROLE_UPDATED",
      workspaceId,
      resourceType: "User",
      resourceId: userId,
      details: `Updated workspace member role to: ${role}`
    });

    res.json({ message: "Member role updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update member role" });
  }
});

// DELETE /api/workspaces/:workspaceId/members/:userId
router.delete("/api/workspaces/:workspaceId/members/:userId", isAuthenticated, requireWorkspacePermission('admin'), async (req: any, res) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId as string);
    const userId = req.params.userId as string;

    await storage.removeWorkspaceMember(userId, workspaceId);

    await SOC2Logger.logEvent(req, {
      userId: req.user.id,
      action: "WORKSPACE_MEMBER_REMOVED",
      workspaceId,
      resourceType: "User",
      resourceId: userId,
      details: "Removed user from workspace"
    });

    res.json({ message: "Member removed from workspace" });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove member from workspace" });
  }
});

// GET /api/workspaces - Fetch all workspaces for the authenticated user
router.get("/api/workspaces", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const workspaces = await storage.getUserWorkspaces(userId);
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch workspaces" });
  }
});

// POST /api/workspaces/:workspaceId/notifications/channels
// Slack/Teams Integration: Register a new webhook delivery channel for real-time contract events
router.post("/api/workspaces/:workspaceId/notifications/channels", isAuthenticated, requireWorkspacePermission('admin'), async (req: any, res) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId as string);
    const { provider, webhookUrl, events } = req.body;

    if (!provider || !webhookUrl) {
      return res.status(400).json({ message: "provider and webhookUrl are required" });
    }

    const { adminClient } = await import("../services/supabase");
    
    const { data: channel, error } = await adminClient
      .from("notification_channels")
      .insert([{
        workspace_id: workspaceId,
        provider,
        webhook_url: webhookUrl,
        events: events || [],
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;

    await SOC2Logger.logEvent(req, {
      userId: req.user.id,
      action: "NOTIFICATION_CHANNEL_CREATED",
      workspaceId,
      resourceType: "Integration",
      resourceId: String(channel.id),
      details: `Configured ${provider} webhook integration.`
    });

    res.status(201).json(channel);
  } catch (err: any) {
    console.error("[SLACK INTEGRATION ERROR]", err.message);
    res.status(500).json({ message: "Failed to configure notification channel" });
  }
});

// POST /api/workspaces/:workspaceId/api-key
// Enterprise Security: Generate a new platform API key.
// Stored securely using bcryptjs; plain text returned exactly once.
router.post("/api/workspaces/:workspaceId/api-key", isAuthenticated, requireWorkspacePermission('admin'), async (req: any, res) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId);
    if (isNaN(workspaceId)) return res.status(400).json({ message: "Invalid workspace ID" });

    // Generate a high-entropy key
    const crypto = await import("crypto");
    const rawKey = `sk.${crypto.randomBytes(24).toString('hex')}`;
    
    // storage.updateUser will automatically hash this via Phase 32 logic
    await storage.updateUser(req.user.id, { apiKey: rawKey });

    await SOC2Logger.logEvent(req, {
      userId: req.user.id,
      action: "API_KEY_GENERATED",
      workspaceId,
      resourceType: "UserSecurity",
      resourceId: req.user.id,
      details: "User rotated/generated a new platform API key."
    });

    res.json({
      apiKey: rawKey,
      message: "API key generated successfully. This is the ONLY time it will be shown in plain text. Please save it securely.",
      securityWarning: "Costloci hashes all API keys using bcryptjs. We cannot recover lost keys."
    });
  } catch (err: any) {
    console.error("[API_KEY_GEN_ERROR]", err.message);
    res.status(500).json({ message: "Failed to generate API key" });
  }
});

export default router;
