import { Router } from "express";
import { storage } from "../storage.js";
import { isAuthenticated } from "../replit_integrations/auth/index.js";
import { AIGateway } from "../services/AIGateway.js";
import { SOC2Logger } from "../services/SOC2Logger.js";
import { storageContext } from "../services/storageContext.js";
import multer from "multer";
import pdf from "pdf-parse";

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB max
});

router.post("/api/insurance/upload", isAuthenticated, upload.single("file"), async (req: any, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // Assuming we have clientId from context
    const clientId = req.user?.clientId;
    const store = storageContext.getStore();
    const workspaceId = store?.workspaceId;

    if (!clientId || !workspaceId) {
      return res.status(400).json({ message: "Missing organization context." });
    }

    const pdfData = await pdf(req.file.buffer);
    const extractedText = pdfData.text.substring(0, 15000);

    const analysis = await AIGateway.analyzeInsurancePolicy(extractedText, workspaceId);

    // Upload to Supabase Storage
    const { adminClient: supabaseAdmin } = await import("../services/supabase.js");
    const storagePath = `insurance/${clientId}/${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    
    const { error: storageError } = await supabaseAdmin.storage
      .from("contracts") // using contracts bucket
      .upload(storagePath, req.file.buffer, {
        contentType: req.file.mimetype || "application/pdf",
        upsert: false,
      });

    if (storageError) throw new Error("Storage upload failed: " + storageError.message);

    const { data: publicUrlData } = supabaseAdmin.storage.from("contracts").getPublicUrl(storagePath);

    // Save to database
    const policy = await storage.createInsurancePolicy({
      workspaceId,
      clientId,
      carrierName: analysis.carrierName || "Pending AI Extraction",
      policyNumber: analysis.policyNumber || "UNKNOWN",
      premiumAmount: 0,
      fileUrl: publicUrlData.publicUrl,
      status: "active",
      coverageLimits: analysis.coverageLimits || {},
      deductibles: analysis.deductibles || {},
      waitingPeriods: analysis.waitingPeriods || {},
      exclusions: analysis.exclusions || [],
      endorsements: analysis.endorsements || [],
      notificationRequirements: analysis.notificationRequirements || {},
      claimRiskScore: analysis.claimRiskScore,
      aiAnalysisSummary: analysis.aiAnalysisSummary
    });

    await SOC2Logger.logEvent(req, {
      action: "INSURANCE_POLICY_UPLOADED",
      userId: req.user.id,
      resourceType: "InsurancePolicy",
      resourceId: String(policy.id),
      details: "New cyber insurance policy uploaded and analyzed."
    });

    res.status(201).json(policy);
  } catch (error: any) {
    console.error("[INSURANCE UPLOAD]", error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/api/insurance/redline", isAuthenticated, async (req: any, res) => {
  try {
    const { originalClause, standardLanguage, instructions } = req.body;
    
    if (!originalClause || !standardLanguage) {
      return res.status(400).json({ message: "Missing required redlining parameters." });
    }

    const redlinedClause = await AIGateway.aiRedlineClause(originalClause, standardLanguage, instructions || "");

    await SOC2Logger.logEvent(req, {
      action: "CLAUSE_REDLINING_EXECUTED",
      userId: req.user.id,
      resourceType: "Clause",
      resourceId: "Redlined AI Generation",
      details: "AI redlined a cyber insurance clause."
    });

    res.json({ redlinedClause });
  } catch (error: any) {
    console.error("[CLAUSE REDLINE]", error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/api/insurance/compare", isAuthenticated, async (req: any, res) => {
  try {
    const { policyIdA, policyIdB } = req.body;
    if (!policyIdA || !policyIdB) {
      return res.status(400).json({ message: "Two policy IDs are required for comparison." });
    }

    const policyA = await storage.getInsurancePolicy(policyIdA);
    const policyB = await storage.getInsurancePolicy(policyIdB);

    if (!policyA || !policyB) {
      return res.status(404).json({ message: "One or both policies not found." });
    }

    // AI comparison layer
    const comparisonContext = `
      Policy A: ${policyA.aiAnalysisSummary}
      Policy B: ${policyB.aiAnalysisSummary}
      
      Limits A: ${JSON.stringify(policyA.coverageLimits)}
      Limits B: ${JSON.stringify(policyB.coverageLimits)}
    `;

    const comparisonSummary = await AIGateway.createCompletion({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a cyber insurance analyst comparing two policies. Identify key differences in coverage, deductibles, and risk scores. Format as a HTML table fragment." },
        { role: "user", content: `Compare these two policies side-by-side: ${comparisonContext}` }
      ]
    });

    res.json({
      policyA,
      policyB,
      comparisonSummary
    });
  } catch (error: any) {
    console.error("[POLICY COMPARE]", error);
    res.status(500).json({ message: error.message });
  }
});

// ─── TRACK 3: DPO METRICS ──────────────────────────────────────────
router.get("/api/dpo/metrics", isAuthenticated, async (req: any, res) => {
  try {
    const workspaceId = storageContext.getStore()?.workspaceId;
    if (!workspaceId) return res.status(400).json({ message: "No workspace context" });

    const [contracts, insurance, risks] = await Promise.all([
      storage.getContracts(),
      storage.getInsurancePolicies(workspaceId),
      storage.getRisks()
    ]);

    const filteredContracts = contracts.filter(c => c.workspaceId === workspaceId);
    const filteredRisks = risks.filter(r => filteredContracts.some(c => c.id === r.contractId));

    // Calculate Scores (Aggregated)
    const complianceScore = Math.round(
      filteredContracts.reduce((acc, c) => acc + (c.aiAnalysis?.legalAlignmentScore || 85), 0) / 
      (filteredContracts.length || 1)
    );

    const readinessScore = Math.round(
      filteredRisks.reduce((acc, r) => acc + (r.mitigationStatus === 'mitigated' ? 100 : 50), 0) /
      (filteredRisks.length || 1)
    );

    res.json({
      complianceScore,
      readinessScore,
      dpasReviewed: filteredContracts.length,
      openFindings: filteredRisks.length,
      heatmap: [
        { standard: 'GDPR', score: 85, color: '#3b82f6' },
        { standard: 'KDPA', score: 92, color: '#06b6d4' },
        { standard: 'CCPA', score: 78, color: '#10b981' },
        { standard: 'ISO27001', score: 88, color: '#8b5cf6' }
      ],
      readinessData: [
        { subject: 'Privacy', A: complianceScore, fullMark: 100 },
        { subject: 'Security', A: 88, fullMark: 100 },
        { subject: 'SLA', A: 75, fullMark: 100 },
        { subject: 'DPA', A: 92, fullMark: 100 }
      ]
    });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch DPO metrics" });
  }
});

export default router;
