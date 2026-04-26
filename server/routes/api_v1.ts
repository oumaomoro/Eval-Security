import { Router } from "express";
import { storage } from "../storage.js";
import { apiKeyAuth } from "../middleware/api-key-auth.js";
import { AIGateway } from "../services/AIGateway.js";
import { z } from "zod";

const router = Router();

/**
 * ENTERPRISE API GATEWAY (V1)
 * 
 * Provides secured, versioned access to platform intelligence.
 * All endpoints require 'X-API-KEY' header.
 */

// 1. Risk Scoring Service
router.get("/risk-score/:contractId", apiKeyAuth, async (req: any, res) => {
  try {
    const contractId = Number(req.params.contractId);
    const contract = await storage.getContract(contractId);

    if (!contract) {
      return res.status(404).json({ error: "not_found", message: "Contract not found." });
    }

    // Tenant Isolation
    if (contract.workspaceId !== req.workspaceId) {
      return res.status(403).json({ error: "access_denied", message: "Unauthorized access to this contract." });
    }

    res.json({
      contractId: contract.id,
      vendor: contract.vendorName,
      riskScore: contract.aiAnalysis?.riskScore || 0,
      riskFlags: contract.aiAnalysis?.riskFlags || [],
      forecasting: {
        renewalDate: contract.renewalDate,
        status: "active"
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: "internal_error", message: err.message });
  }
});

// 2. Stateless Clause Analysis
router.post("/analyze-clause", apiKeyAuth, async (req, res) => {
  try {
    const { clauseText } = z.object({ clauseText: z.string().min(10) }).parse(req.body);

    const prompt = `Analyze the following cybersecurity contract clause for legal and compliance risks (KDPA/GDPR).
    Return a JSON object: { "riskLevel": "low" | "medium" | "high" | "critical", "issues": string[], "recommendation": string }
    
    CLAUSE: ${clauseText}`;

    const analysisStr = await AIGateway.createCompletion({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(analysisStr);
    res.json(analysis);
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: "validation_error", details: err.errors });
    res.status(500).json({ error: "inference_failed", message: err.message });
  }
});

// 3. Compliance Posture
router.get("/compliance-posture", apiKeyAuth, async (req: any, res) => {
  try {
    const audits = await storage.getComplianceAudits();
    const filteredAudits = audits.filter(a => a.workspaceId === req.workspaceId);

    const overallScore = filteredAudits.length > 0 
      ? Math.round(filteredAudits.reduce((acc, a) => acc + (a.overallComplianceScore || 0), 0) / filteredAudits.length)
      : 0;

    res.json({
      workspaceId: req.workspaceId,
      overallComplianceScore: overallScore,
      auditCount: filteredAudits.length,
      status: overallScore > 80 ? "compliant" : "action_required"
    });
  } catch (err: any) {
    res.status(500).json({ error: "data_fetch_failed", message: err.message });
  }
});

// 4. Real-time Collaboration Heartbeat
router.post("/collaboration/presence", apiKeyAuth, async (req: any, res) => {
  try {
    const { resourceType, resourceId } = z.object({
      resourceType: z.string(),
      resourceId: z.string()
    }).parse(req.body);

    await storage.upsertPresence({
      workspaceId: req.workspaceId,
      userId: req.user.id,
      resourceType,
      resourceId
    });

    const activeUsers = await storage.getActivePresence(req.workspaceId, resourceType, resourceId);
    res.json({ activeUsers });
  } catch (err: any) {
    res.status(500).json({ error: "heartbeat_failed", message: err.message });
  }
});

export default router;
