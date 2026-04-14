import { Router } from "express";
import { GovernanceAuditor } from "../services/GovernanceAuditor";
import { isAuthenticated } from "../replit_integrations/auth";
import memoize from "memoizee";

const router = Router();

// Use the CGO AI for high-fidelity posture reports
// Cached for 60 minutes as per user agreement
const cachedPosture = memoize(
  () => GovernanceAuditor.generatePostureReport(),
  { promise: true, maxAge: 3600000 }
);

/**
 * GET /api/governance/posture
 * Returns the Chief Governance Officer (CGO) AI review of the platform.
 */
router.get("/api/governance/posture", isAuthenticated, async (_req, res) => {
  try {
    const report = await cachedPosture();
    res.json(report);
  } catch (error: any) {
    console.error("[GOVERNANCE API ERROR]", error);
    res.status(500).json({ message: "Failed to generate autonomous posture review." });
  }
});

export default router;
