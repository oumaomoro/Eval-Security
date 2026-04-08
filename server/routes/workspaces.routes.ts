import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth";
import { requireWorkspacePermission } from "../middleware/workspace-rbac";
import { z } from "zod";

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
router.post("/api/workspaces/:workspaceId/members", isAuthenticated, requireWorkspacePermission('admin'), async (req, res) => {
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
    
    res.status(201).json(member);
  } catch (error) {
    res.status(500).json({ message: "Failed to add member to workspace" });
  }
});

// PUT /api/workspaces/:workspaceId/members/:userId
router.put("/api/workspaces/:workspaceId/members/:userId", isAuthenticated, requireWorkspacePermission('admin'), async (req, res) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId as string);
    const userId = req.params.userId as string;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ message: "role is required" });
    }

    await storage.updateWorkspaceMemberRole(userId, workspaceId, role);
    res.json({ message: "Member role updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update member role" });
  }
});

// DELETE /api/workspaces/:workspaceId/members/:userId
router.delete("/api/workspaces/:workspaceId/members/:userId", isAuthenticated, requireWorkspacePermission('admin'), async (req, res) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId as string);
    const userId = req.params.userId as string;

    await storage.removeWorkspaceMember(userId, workspaceId);
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

export default router;
