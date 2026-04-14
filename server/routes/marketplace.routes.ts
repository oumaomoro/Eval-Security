import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth";

const router = Router();

/**
 * POST /api/marketplace/activate
 * Persists an activated playbook/standard to the organization's (workspace) profile.
 */
router.post("/api/marketplace/activate", isAuthenticated, async (req: any, res) => {
  try {
    const { standardName } = req.body;
    if (!standardName) {
      return res.status(400).json({ message: "standardName is required" });
    }

    // Resolve workspace ID from the request context
    const workspaceId = req.user?.organizationId || req.user?.clientId; // Flexibility for context
    if (!workspaceId) {
      return res.status(400).json({ message: "No active workspace context found for this user." });
    }

    // Fetch current active standards
    const workspace = await storage.getWorkspace(Number(workspaceId));
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found." });
    }

    const currentStandards = Array.isArray(workspace.activeStandards) ? workspace.activeStandards : [];
    
    // Simple toggle logic: if exists, remove (deactivate); if not, add (activate).
    let newStandards: string[];
    let action: string;

    if (currentStandards.includes(standardName)) {
      newStandards = currentStandards.filter((s: string) => s !== standardName);
      action = "deactivated";
    } else {
      newStandards = [...currentStandards, standardName];
      action = "activated";
    }

    await storage.updateWorkspace(workspace.id, { activeStandards: newStandards });

    res.json({ 
      message: `Standard successfully ${action}.`,
      activeStandards: newStandards 
    });

  } catch (error: any) {
    console.error("[MARKETPLACE API ERROR]", error);
    res.status(500).json({ message: "Failed to update governance engine standards." });
  }
});

export default router;
