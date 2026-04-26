import { Router } from "express";
import { storage } from "../storage.js";
import { isAuthenticated } from "../replit_integrations/auth/index.js";
import { ScorecardEngine } from "../services/ScorecardEngine.js";
import { SOC2Logger } from "../services/SOC2Logger.js";

const router = Router();

/**
 * GET /api/vendors/scorecards
 */
router.get("/vendors/scorecards", isAuthenticated, async (req: any, res) => {
  try {
    const vendorName = req.query.vendorName as string;
    const scorecards = await storage.getVendorScorecards(vendorName);
    res.json(scorecards);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch scorecards" });
  }
});

/**
 * POST /api/vendors/scorecards/recalculate
 * Trigger AI-driven recalculation of a vendor's scorecard.
 */
router.post("/vendors/scorecards/recalculate", isAuthenticated, async (req: any, res) => {
  try {
    const { vendorName } = req.body;
    if (!vendorName) return res.status(400).json({ message: "Vendor name is required" });

    const scorecard = await ScorecardEngine.updateScorecard(vendorName, req.workspaceId);
    
    if (!scorecard) {
      return res.status(404).json({ message: `No data found to generate scorecard for ${vendorName}` });
    }

    await SOC2Logger.logEvent(req, {
      action: "VENDOR_SCORECARD_RECALCULATED",
      userId: req.user.id,
      resourceType: "VendorScorecard",
      resourceId: String(scorecard.id),
      details: `Recalculated multi-dimensional score for ${vendorName}. Grade: ${scorecard.overallGrade}`
    });

    res.json(scorecard);
  } catch (error: any) {
    console.error("[VENDOR API ERROR]", error.message);
    res.status(500).json({ message: "Failed to recalculate scorecard" });
  }
});

/**
 * GET /api/vendors/benchmarks
 */
router.get("/vendors/benchmarks", isAuthenticated, async (req: any, res) => {
  try {
    const benchmarks = await storage.getVendorBenchmarks();
    res.json(benchmarks);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch benchmarks" });
  }
});

export default router;
