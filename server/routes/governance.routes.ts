import { Router } from "express";
import { GovernanceAuditor } from "../services/GovernanceAuditor.js";
import { isAuthenticated } from "../replit_integrations/auth/index.js";
import memoize from "memoizee";

import { SOC2Logger } from "../services/SOC2Logger.js";

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
router.get("/governance/posture", isAuthenticated, async (req: any, res) => {
  try {
    const report = await cachedPosture();

    await SOC2Logger.logEvent(req, {
        action: "GOVERNANCE_POSTURE_RETRIEVED",
        userId: req.user.id,
        resourceType: "Infrastructure",
        resourceId: "GLOBAL_SYSTEM",
        details: "AI-Generated Executive Posture Report accessed."
    });

    res.json(report);
  } catch (error: any) {
    console.error("[GOVERNANCE API ERROR]", error.message);
    res.status(500).json({ message: "Failed to generate autonomous posture review." });
  }
});

export default router;
