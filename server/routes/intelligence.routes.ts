import { Router } from "express";
import { storage } from "../storage.js";
import { isAuthenticated } from "../replit_integrations/auth/index.js";
import { SOC2Logger } from "../services/SOC2Logger.js";
import { AIGateway } from "../services/AIGateway.js";

const router = Router();

/**
 * GET /api/contracts/:id/benchmarking
 * 
 * Unlocks Phase 26 Marketplace Intelligence logic.
 * Benchmarks the target contract against anonymized category peers 
 * from the Costloci global hub.
 */
router.get("/contracts/:id/benchmarking", isAuthenticated, async (req, res) => {
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

/**
 * POST /api/intelligence/generate-clause
 * Advanced AI-driven clause generation for specific jurisdictions.
 */
router.post("/intelligence/generate-clause", isAuthenticated, async (req: any, res) => {
  try {
    const { category, requirements, standards = ["KDPA"], tone = "balanced", risks = [] } = req.body;
    
    if (!category || !requirements) {
      return res.status(400).json({ message: "Category and requirements are required." });
    }

    const result = await AIGateway.generateClauseIntelligence({
      category,
      standards,
      requirements,
      risks,
      tone
    });
    
    await SOC2Logger.logEvent(req, {
      action: "CLAUSE_GENERATED",
      userId: req.user.id,
      resourceType: "Intelligence",
      resourceId: category,
      details: `Generated high-fidelity ${category} clause.`
    });

    res.json(result);
  } catch (error: any) {
    console.error("[INTELLIGENCE API ERROR]", error.message);
    res.status(500).json({ message: "Clause generation failed." });
  }
});

/**
 * POST /api/intelligence/compare-clauses
 * Compares a contract clause against the standard library and identifies deviations.
 */
router.post("/intelligence/compare-clauses", isAuthenticated, async (req: any, res) => {
  try {
    const { contractClauseId, libraryClauseId } = req.body;
    
    const [clauses, library] = await Promise.all([
      storage.getContractClauses(),
      storage.getClauseLibrary()
    ]);

    const contractClause = clauses.find(c => c.id === contractClauseId);
    const standardClause = library.find(c => c.id === libraryClauseId);

    if (!contractClause || !standardClause) {
      return res.status(404).json({ message: "One or both clauses not found." });
    }

    const comparison = await AIGateway.compareClauseIntelligence(
      contractClause.content,
      standardClause.standardLanguage,
      standardClause.clauseCategory
    );

    res.json(comparison);
  } catch (error: any) {
    console.error("[INTELLIGENCE API ERROR]", error.message);
    res.status(500).json({ message: "Clause comparison failed." });
  }
});

export default router;
