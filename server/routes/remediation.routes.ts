import { Router } from "express";
import { storage } from "../storage.js";
import { isAuthenticated } from "../replit_integrations/auth/index.js";
import { SOC2Logger } from "../services/SOC2Logger.js";
import { z } from "zod";

const router = Router();

/**
 * List all remediation suggestions for the active workspace.
 */
router.get("/api/remediation-suggestions", isAuthenticated, async (req: any, res) => {
  try {
    const suggestions = await storage.getRemediationSuggestions();
    res.json(suggestions);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Get suggestions for a specific contract.
 */
router.get("/api/contracts/:id/remediation-suggestions", isAuthenticated, async (req: any, res) => {
  try {
    const contractId = parseInt(req.params.id);
    const suggestions = await storage.getRemediationSuggestions(contractId);
    res.json(suggestions);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Accept a remediation suggestion.
 */
router.post("/api/remediation-suggestions/:id/accept", isAuthenticated, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const suggestion = await storage.getRemediationSuggestion(id);
    
    if (!suggestion) {
      return res.status(404).json({ message: "Suggestion not found" });
    }

    // Update status to accepted
    const updated = await storage.updateRemediationSuggestion(id, {
      status: "accepted",
      acceptedAt: new Date()
    });

    await SOC2Logger.logEvent(req, {
      action: "REMEDIATION_SUGGESTION_ACCEPTED",
      userId: req.user.id,
      resourceType: "RemediationSuggestion",
      resourceId: String(id),
      details: `User accepted remediation suggestion for ${suggestion.standard} on contract ${suggestion.contractId}`
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Dismiss a remediation suggestion.
 */
router.post("/api/remediation-suggestions/:id/dismiss", isAuthenticated, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await storage.updateRemediationSuggestion(id, {
      status: "dismissed"
    });

    await SOC2Logger.logEvent(req, {
      action: "REMEDIATION_SUGGESTION_DISMISSED",
      userId: req.user.id,
      resourceType: "RemediationSuggestion",
      resourceId: String(id),
      details: `User dismissed remediation suggestion #${id}`
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
