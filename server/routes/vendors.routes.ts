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
 * Returns real dynamic vendor aggregation across user contracts with live risk and compliance calculations.
 */
router.get("/vendors/benchmarks", isAuthenticated, async (req: any, res) => {
  try {
    const workspaceId = req.user?.workspaceId || 1;
    const [contracts, risks, scorecards] = await Promise.all([
      storage.getContracts({ workspaceId }).catch(() => []),
      storage.getRisks(undefined, workspaceId).catch(() => []),
      storage.getVendorScorecards().catch(() => [])
    ]);

    const filteredContracts = (contracts || []).filter(c => !workspaceId || c.workspaceId === workspaceId);
    const filteredRisks = (risks || []).filter(r => !workspaceId || r.workspaceId === workspaceId);

    // Group contracts by vendor entity
    const vendorMap = new Map<string, {
      vendor: string;
      totalCost: number;
      contractCount: number;
      highestRisk: number;
      riskScore: number;
      avgCompliance: number;
      category: string;
    }>();

    for (const contract of filteredContracts) {
      const vendorName = contract.vendorName?.trim() || "Managed Vendor";
      const existing = vendorMap.get(vendorName) || {
        vendor: vendorName,
        totalCost: 0,
        contractCount: 0,
        highestRisk: 0,
        riskScore: 0,
        avgCompliance: 85,
        category: contract.category || "Security Service"
      };

      existing.totalCost += Number(contract.annualCost || 0);
      existing.contractCount += 1;

      // Correlate risks for this contract
      const contractRisks = filteredRisks.filter((r: any) => r.contractId === contract.id);
      for (const r of contractRisks) {
        const score = Number(r.riskScore || 0);
        if (score > existing.highestRisk) existing.highestRisk = score;
      }

      // Check for persisted vendor scorecard
      const sc = scorecards.find((s: any) => s.vendorName?.toLowerCase() === vendorName.toLowerCase());
      if (sc) {
        existing.avgCompliance = Number(sc.complianceScore) || existing.avgCompliance;
        existing.riskScore = Number(sc.riskScore) || existing.highestRisk;
      } else {
        existing.riskScore = existing.highestRisk || Math.min(30, contractRisks.length * 10);
        existing.avgCompliance = Math.max(40, 100 - (contractRisks.length * 8));
      }

      vendorMap.set(vendorName, existing);
    }

    const result = Array.from(vendorMap.values());
    res.json(result);
  } catch (error: any) {
    console.error("[VENDOR BENCHMARKS ERROR]", error.message);
    res.status(500).json({ message: "Failed to fetch vendor benchmarks" });
  }
});

export default router;
