import { Router } from "express";
import { isAuthenticated } from "../replit_integrations/auth/index.js";
import { storage } from "../storage.js";
import { PlaybookService } from "../services/PlaybookService.js";
import { storageContext } from "../services/storageContext.js";

const router = Router();

// ── LIST PLAYBOOKS ──────────────────────────────────────────────────────────
router.get("/playbooks", isAuthenticated, async (req: any, res) => {
  try {
    const store = storageContext.getStore();
    const workspaceId = store?.workspaceId;
    const playbooks = await storage.getPlaybooks();
    res.json(playbooks);
  } catch (err: any) {
    console.error("[PLAYBOOKS] GET /playbooks failed:", err.message);
    res.status(500).json({ message: "Failed to fetch playbooks" });
  }
});

// ── CREATE PLAYBOOK ─────────────────────────────────────────────────────────
router.post("/playbooks", isAuthenticated, async (req: any, res) => {
  try {
    const store = storageContext.getStore();
    const workspaceId = store?.workspaceId;
    if (!workspaceId) return res.status(400).json({ message: "Workspace context missing" });

    const { name, description, isActive } = req.body;
    if (!name) return res.status(400).json({ message: "Playbook name is required" });

    const playbook = await storage.createPlaybook({ workspaceId, name, description, isActive: isActive ?? true });
    res.status(201).json(playbook);
  } catch (err: any) {
    console.error("[PLAYBOOKS] POST /playbooks failed:", err.message);
    res.status(500).json({ message: "Failed to create playbook" });
  }
});

// ── UPDATE PLAYBOOK ─────────────────────────────────────────────────────────
router.put("/playbooks/:id", isAuthenticated, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const updated = await storage.updatePlaybook(id, req.body);
    res.json(updated);
  } catch (err: any) {
    console.error("[PLAYBOOKS] PUT /playbooks/:id failed:", err.message);
    res.status(500).json({ message: "Failed to update playbook" });
  }
});

// ── DELETE PLAYBOOK ─────────────────────────────────────────────────────────
router.delete("/playbooks/:id", isAuthenticated, async (req: any, res) => {
  try {
    await storage.deletePlaybook(Number(req.params.id));
    res.status(204).send();
  } catch (err: any) {
    console.error("[PLAYBOOKS] DELETE /playbooks/:id failed:", err.message);
    res.status(500).json({ message: "Failed to delete playbook" });
  }
});

// ── AI: GENERATE NEGOTIATION PLAYBOOK ──────────────────────────────────────
router.post("/playbooks/generate/:contractId", isAuthenticated, async (req: any, res) => {
  try {
    const contractId = Number(req.params.contractId);
    const result = await PlaybookService.generateNegotiationPlaybook(contractId);
    res.json(result);
  } catch (err: any) {
    console.error("[PLAYBOOKS] POST /playbooks/generate/:contractId failed:", err.message);
    res.status(500).json({ message: "Failed to generate negotiation playbook: " + err.message });
  }
});

// ── LIST RULES FOR PLAYBOOK ────────────────────────────────────────────────
router.get("/playbooks/:id/rules", isAuthenticated, async (req: any, res) => {
  try {
    const rules = await storage.getPlaybookRules(Number(req.params.id));
    res.json(rules);
  } catch (err: any) {
    console.error("[PLAYBOOKS] GET /playbooks/:id/rules failed:", err.message);
    res.status(500).json({ message: "Failed to fetch playbook rules" });
  }
});

// ── CREATE RULE ─────────────────────────────────────────────────────────────
router.post("/playbooks/:id/rules", isAuthenticated, async (req: any, res) => {
  try {
    const playbookId = Number(req.params.id);
    const { name, condition, action, priority } = req.body;
    if (!name || !condition || !action) {
      return res.status(400).json({ message: "name, condition, and action are required" });
    }
    const rule = await storage.createPlaybookRule({ playbookId, name, condition, action, priority: priority ?? 0 });
    res.status(201).json(rule);
  } catch (err: any) {
    console.error("[PLAYBOOKS] POST /playbooks/:id/rules failed:", err.message);
    res.status(500).json({ message: "Failed to create playbook rule" });
  }
});

// ── UPDATE RULE ─────────────────────────────────────────────────────────────
router.put("/playbooks/rules/:ruleId", isAuthenticated, async (req: any, res) => {
  try {
    const ruleId = Number(req.params.ruleId);
    const updated = await storage.updatePlaybookRule(ruleId, req.body);
    res.json(updated);
  } catch (err: any) {
    console.error("[PLAYBOOKS] PUT /playbooks/rules/:ruleId failed:", err.message);
    res.status(500).json({ message: "Failed to update playbook rule" });
  }
});

// ── DELETE RULE ─────────────────────────────────────────────────────────────
router.delete("/playbooks/rules/:ruleId", isAuthenticated, async (req: any, res) => {
  try {
    await storage.deletePlaybookRule(Number(req.params.ruleId));
    res.status(204).send();
  } catch (err: any) {
    console.error("[PLAYBOOKS] DELETE /playbooks/rules/:ruleId failed:", err.message);
    res.status(500).json({ message: "Failed to delete playbook rule" });
  }
});

export default router;
