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

export default router;
