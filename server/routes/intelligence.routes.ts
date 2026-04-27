import { Router } from "express";
import { storage } from "../storage.js";
import { isAuthenticated } from "../replit_integrations/auth/index.js";
import { SOC2Logger } from "../services/SOC2Logger.js";
import { IntelligenceGateway } from "../services/IntelligenceGateway.js";

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

    const result = await IntelligenceGateway.generateClauseIntelligence({
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
    const { contractClauseId, libraryClauseId, contractText } = req.body;
    
    let comparisonText = contractText;
    let category = "General";

    if (contractClauseId) {
      const clauses = await storage.getContractClauses();
      const contractClause = clauses.find(c => c.id === contractClauseId);
      if (contractClause) {
        comparisonText = contractClause.content;
        category = contractClause.category;
      }
    }

    const library = await storage.getClauseLibrary();
    const standardClause = library.find(c => c.id === libraryClauseId);

    if (!standardClause) {
      return res.status(404).json({ message: "Standard library clause not found." });
    }

    if (!comparisonText) {
      return res.status(400).json({ message: "Contract text or clause ID is required." });
    }

    const comparison = await IntelligenceGateway.compareClauseIntelligence(
      comparisonText,
      standardClause.standardLanguage,
      standardClause.clauseCategory || category
    );

    res.json(comparison);
  } catch (error: any) {
    console.error("[INTELLIGENCE API ERROR]", error.message);
    res.status(500).json({ message: "Clause comparison failed." });
  }
});

/**
 * GET /api/contracts/:id/versions
 * Fetches the version history of a contract.
 */
router.get("/contracts/:id/versions", isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid contract ID" });
    const versions = await storage.getContractVersions(id);
    res.json(versions);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch version history." });
  }
});

/**
 * POST /api/contracts/:id/versions
 * Creates a new version for a contract (e.g., after a manual upload or automated remediation).
 */
router.post("/contracts/:id/versions", isAuthenticated, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { fileUrl, changesSummary } = req.body;
    
    if (isNaN(id) || !fileUrl) {
      return res.status(400).json({ message: "Contract ID and file URL are required." });
    }

    const existingVersions = await storage.getContractVersions(id);
    const nextVersion = existingVersions.length > 0 
      ? Math.max(...existingVersions.map((v: any) => v.versionNumber)) + 1 
      : 1;

    const version = await storage.createContractVersion({
      contractId: id,
      versionNumber: nextVersion,
      fileUrl,
      changesSummary: changesSummary || `Manual version ${nextVersion} upload.`,
      createdBy: req.user.id
    });

    // Optionally update the main contract record to point to this new fileUrl
    await storage.updateContract(id, { fileUrl });

    res.json(version);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to create new version." });
  }
});

export default router;
