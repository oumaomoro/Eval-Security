/**
 * server/routes/integrations.routes.ts
 *
 * Phase 27: Microsoft Word Subsystem Synergy
 *
 * Handles secure API endpoints for the Costloci Office Add-in:
 *   POST /api/integrations/word/analyze  — Deep AI analysis of document text
 *   POST /api/integrations/word/publish  — Sync an accepted clause to the Clause Library
 *
 * NOTE (Phase 27): API Key auth is currently validated against the user's stored api_key
 * field. A formal self-serve API key generation UI (for the WorkspaceSettings page) is
 * planned for a future phase. For now, users link their add-in via their Supabase JWT or
 * a platform-managed bearer token issued during login.
 */

import { Router } from "express";
import { storage } from "../storage.js";
import { IntelligenceGateway } from "../services/IntelligenceGateway.js";
import { SOC2Logger } from "../services/SOC2Logger.js";
import memoize from "memoizee";
import { z } from "zod";

const router = Router();

// Cache identical analysis prompts for 30 minutes to avoid redundant API calls
const cachedWordAnalysis = memoize(
  (params: any) => IntelligenceGateway.createCompletion(params),
  {
    promise: true,
    maxAge: 1800000,
    normalizer: (args: any[]) => JSON.stringify(args),
  }
);

// ─── API Key Auth Middleware ──────────────────────────────────────────────────
/**
 * Light auth for external add-in consumers.
 * Accepts either:
 *  1. A session cookie (isAuthenticated-style, for in-browser dev)
 *  2. A Bearer token matching req.user.apiKey (for the Word add-in)
 */
async function authenticateAddinRequest(req: any, res: any, next: any) {
  // If a session user exists (e.g., local dev hitting the endpoint via browser), pass through
  if (req.user) return next();

  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Unauthorized: Provide a valid Bearer token from your Costloci account settings.",
    });
  }

  const token = authHeader.slice(7);

  // Validate against the api_key field on user profiles
  // The storage layer exposes getUserByApiKey which uses a safe lookup
  try {
    const user = await storage.getUserByApiKey(token);
    if (!user) {
      return res.status(401).json({ message: "Invalid API key. Generate a new one from Workspace Settings." });
    }
    req.user = user;
    return next();
  } catch (err) {
    console.error("[INTEGRATIONS AUTH ERROR]", err);
    return res.status(500).json({ message: "Auth verification failed." });
  }
}

// ─── Input Schemas ────────────────────────────────────────────────────────────
const analyzeInputSchema = z.object({
  textBlock: z.string().min(10, "Document text is too short to analyze.").max(250000),
});

const publishInputSchema = z.object({
  clauseName: z.string().min(2),
  clauseCategory: z.string().min(2),
  standardLanguage: z.string().min(10),
  riskLevelIfMissing: z.enum(["critical", "high", "medium", "low"]).default("medium"),
  jurisdiction: z.string().optional().default("International"),
  applicableStandards: z.array(z.string()).optional().default(["KDPA", "GDPR"]),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /api/integrations/word/analyze
 *
 * Accepts raw document text from the MS Word context and performs a
 * multi-dimensional AI security & compliance analysis.
 *
 * Response shape matches the Add-in's App.tsx expectations:
 * {
 *   riskScore: number,
 *   complianceStatus: string,
 *   leveragePoints: string[],
 *   findings: Array<{ requirement, severity, description }>
 * }
 */
router.post("/integrations/word/analyze", authenticateAddinRequest, async (req: any, res) => {
  try {
    const { textBlock } = analyzeInputSchema.parse(req.body);

    const responseText = await cachedWordAnalysis({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are Costloci's sovereign AI contract auditor specializing in MEA regulatory frameworks (KDPA 2019, CBK Cyber Risk Guidelines, POPIA, ISO 27001, GDPR).

Analyze the provided document text and return a structured JSON with EXACTLY these fields:
{
  "riskScore": <integer 0-100, higher = riskier>,
  "complianceStatus": <one of: "Compliant" | "Partial" | "Non-Compliant" | "Critical Risk">,
  "leveragePoints": <array of 2-4 plain-English negotiation advantages or cost saving strings>,
  "findings": <array of compliance gap objects>
}

Each finding object must have:
  "requirement": <short clause type, e.g. "Data Residency Clause">,
  "severity": <"critical" | "high" | "medium" | "low">,
  "description": <1-2 sentences explaining the gap and preferred remediation>

Be precise, cite KDPA sections when applicable, and prioritize actionable intelligence.`,
        },
        {
          role: "user",
          content: `Analyze the following contract document:\n\n${textBlock.substring(0, 15000)}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(responseText || "{}");

    // Normalise to guarantee shape even if the model truncates
    const result = {
      riskScore: typeof analysis.riskScore === "number" ? analysis.riskScore : 50,
      complianceStatus: analysis.complianceStatus || "Partial",
      leveragePoints: Array.isArray(analysis.leveragePoints) ? analysis.leveragePoints : [],
      findings: Array.isArray(analysis.findings) ? analysis.findings : [],
    };

    // Audit log for enterprise traceability
    try {
      await SOC2Logger.logEvent(req, {
        userId: req.user?.id || "ADDIN_USER",
        action: "WORD_ADDIN_ANALYSIS",
        resourceType: "WordDocument",
        resourceId: "external",
        details: `MS Word Add-in analysis: Risk ${result.riskScore}%, Status: ${result.complianceStatus}, Findings: ${result.findings.length}`
      });
    } catch (auditErr: any) {
      console.warn("[WORD-ANALYSIS-AUDIT] Logging failed:", auditErr.message);
    }

    res.json(result);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error("[WORD ANALYSIS ERROR]", err.message);
    res.status(500).json({ message: "Document analysis failed: " + err.message });
  }
});

/**
 * POST /api/integrations/word/publish
 *
 * Syncs a user-accepted AI-suggested clause back to the Costloci
 * central Clause Library, making it available across the web platform.
 */
router.post("/integrations/word/publish", authenticateAddinRequest, async (req: any, res) => {
  try {
    const input = publishInputSchema.parse(req.body);

    const clause = await storage.createClauseLibraryItem({
      clauseName: input.clauseName,
      clauseCategory: input.clauseCategory,
      standardLanguage: input.standardLanguage,
      riskLevelIfMissing: input.riskLevelIfMissing,
      jurisdiction: input.jurisdiction || "International",
      applicableStandards: input.applicableStandards || ["KDPA", "GDPR"],
      isMandatory: false,
    });

    await SOC2Logger.logEvent(req, {
      userId: req.user?.id || "ADDIN_USER",
      action: "WORD_ADDIN_CLAUSE_PUBLISHED",
      resourceType: "Clause",
      resourceId: String(clause.id),
      details: `Clause synced from MS Word Add-in: "${input.clauseName}" (${input.clauseCategory})`
    });

    res.status(201).json({
      success: true,
      clause,
      message: `"${input.clauseName}" has been synced to your Costloci Clause Library.`,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error("[WORD PUBLISH ERROR]", err.message);
    res.status(500).json({ message: "Clause sync failed: " + err.message });
  }
});

/**
 * GET /api/integrations/notification-channels
 * Returns active notification channels (Slack, Webhooks) for the current workspace.
 */
router.get("/notification-channels", authenticateAddinRequest, async (req: any, res) => {
  try {
    const workspaceId = req.user.workspaceId || (await storage.getUserWorkspaces(req.user.id))[0]?.id;
    if (!workspaceId) return res.status(400).json({ message: "No active workspace context." });
    
    const channels = await storage.getNotificationChannels(workspaceId);
    res.json(channels);
  } catch (error: any) {
    console.error("[INTEGRATIONS API ERROR]", error.message);
    res.status(500).json({ message: "Failed to fetch notification channels." });
  }
});

/**
 * POST /api/integrations/notification-channels
 * Provisions a new notification channel for the enterprise.
 */
router.post("/notification-channels", authenticateAddinRequest, async (req: any, res) => {
  try {
    const workspaceId = req.user.workspaceId || (await storage.getUserWorkspaces(req.user.id))[0]?.id;
    if (!workspaceId) return res.status(400).json({ message: "No active workspace context." });

    const channel = await storage.createNotificationChannel({
      ...req.body,
      workspaceId,
      clientId: req.user.clientId
    });

    await SOC2Logger.logEvent(req, {
      userId: req.user.id,
      action: "NOTIFICATION_CHANNEL_CREATED",
      resourceType: "NotificationChannel",
      resourceId: String(channel.id),
      details: `New ${channel.provider} webhook provisioned for workspace ${workspaceId}`
    });

    res.status(201).json(channel);
  } catch (error: any) {
    console.error("[INTEGRATIONS API ERROR]", error.message);
    res.status(500).json({ 
      message: "Failed to create notification channel.",
      error: error.message 
    });
  }
});

export default router;
