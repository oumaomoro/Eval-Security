import { Router } from "express";
import axios from "axios";
import { SOC2Logger } from "../services/SOC2Logger.js";

const router = Router();

/**
 * Enterprise Rollback Webhook (Sentry -> Vercel)
 * ══════════════════════════════════════════════
 * This endpoint is triggered by Sentry Alerts when a >5% error spike 
 * is detected. It automatically triggers a Vercel rollback to the 
 * last known stable deployment hash.
 */
router.post("/sentry-rollback", async (req, res) => {
  try {
    const { action, data } = req.body;
    
    // 1. Verify Sentry Signature (In production, validate req.headers['sentry-hook-signature'])
    // For now, we use a simple shared secret for demonstration.
    const hookSecret = process.env.SENTRY_WEBHOOK_SECRET;
    if (hookSecret && req.headers['x-sentry-token'] !== hookSecret) {
      return res.status(401).json({ message: "Invalid Sentry Signature" });
    }

    console.log(`[ROLLBACK] 🚨 Received Sentry Alert: ${data?.issue?.title || 'Unknown Issue'}`);

    // 2. Identify Target Deployment
    // In a real scenario, we fetch the last successful deployment via Vercel API.
    const vercelToken = process.env.VERCEL_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID;
    const teamId = process.env.VERCEL_TEAM_ID;

    if (!vercelToken || !projectId) {
      console.error("[ROLLBACK] ❌ Vercel credentials missing. Manual intervention required.");
      return res.status(500).json({ message: "Infrastructure credentials missing." });
    }

    // 3. Fetch Last Stable Deployment
    const deploymentsResponse = await axios.get(
      `https://api.vercel.com/v6/deployments?projectId=${projectId}${teamId ? `&teamId=${teamId}` : ''}`,
      { headers: { Authorization: `Bearer ${vercelToken}` } }
    );

    const deployments = deploymentsResponse.data.deployments || [];
    const stableDeployment = deployments.find((d: any) => d.state === 'READY' && d.uid !== data?.event?.release);

    if (!stableDeployment) {
       console.error("[ROLLBACK] ❌ No stable rollback target found.");
       return res.status(404).json({ message: "No stable deployment found." });
    }

    console.log(`[ROLLBACK] 🔄 Rolling back to stable deployment: ${stableDeployment.uid} (${stableDeployment.url})`);

    // 4. Trigger Rollback (Alias the stable deployment to the production domain)
    // Note: Vercel "Rollback" is effectively re-aliasing.
    await axios.post(
      `https://api.vercel.com/v2/deployments/${stableDeployment.uid}/aliases`,
      { alias: process.env.PRODUCTION_DOMAIN || "api.costloci.com" },
      { headers: { Authorization: `Bearer ${vercelToken}` } }
    );

    // 5. Log & Notify
    await SOC2Logger.logEvent(req, {
      action: "INFRASTRUCTURE_ROLLBACK_TRIGGERED",
      userId: "SENTRY_AUTOMATION",
      resourceType: "Deployment",
      resourceId: stableDeployment.uid,
      details: `Automated rollback triggered by Sentry spike: ${data?.issue?.title}`
    });

    res.json({ 
      success: true, 
      message: "Rollback initiated successfully",
      target: stableDeployment.url 
    });

  } catch (error: any) {
    console.error("[ROLLBACK ERROR]", error.response?.data || error.message);
    res.status(500).json({ message: "Failed to process rollback trigger." });
  }
});

export default router;
