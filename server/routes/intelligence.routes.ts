import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth";
import { SOC2Logger } from "../services/SOC2Logger";

const router = Router();

/**
 * GET /api/contracts/:id/benchmarking
 * 
 * Unlocks Phase 26 Marketplace Intelligence logic.
 * Benchmarks the target contract against anonymized category peers 
 * from the Costloci global hub.
 */
router.get("/api/contracts/:id/benchmarking", isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid contract ID" });

    // Fetch market intelligence from storage engine
    const benchmark = await storage.getMarketIntelligence(id);
    
    // Audit log for enterprise transparency
    await SOC2Logger.logEvent(req as any, {
        action: "MARKET_BENCHMARK_RETRIEVED",
        userId: (req as any).user?.id || "SYSTEM",
        resourceType: "Contract",
        resourceId: String(id),
        details: `Calculated market intelligence for ${benchmark.category}. Peer count: ${benchmark.peerCount}.`
    });

    res.json(benchmark);
  } catch (error: any) {
    console.error("[INTELLIGENCE API ERROR]", error.message);
    res.status(500).json({ message: "Failed to fetch market benchmarking data." });
  }
});

export default router;
