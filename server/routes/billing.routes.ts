import { Router } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { storage } from "../storage";

const billingRouter = Router();

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_API_BASE = "https://api-m.paypal.com";

const PLANS = {
  starter: process.env.PAYPAL_STARTER_PLAN_ID,
  pro: process.env.PAYPAL_PRO_PLAN_ID,
  enterprise: process.env.PAYPAL_ENTERPRISE_PLAN_ID
};

// Validate PayPal configuration at module load time
if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
  console.warn("[BILLING] WARNING: PAYPAL_CLIENT_ID / PAYPAL_SECRET not set — checkout will fail.");
}
if (!PLANS.starter || !PLANS.pro || !PLANS.enterprise) {
  console.warn("[BILLING] WARNING: One or more PAYPAL_*_PLAN_ID env vars not set — subscription creation will fail.");
}

/**
 * Generate a PayPal access token
 */
async function getPayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64");
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  
  if (!response.ok) throw new Error("Failed to get PayPal Access Token");
  const data = await response.json();
  return data.access_token;
}

/**
 * Create a subscription checkout session for the user
 */
billingRouter.post("/api/billing/subscribe", isAuthenticated, async (req: any, res) => {
  try {
    const { planType } = req.body;
    const planId = PLANS[planType as keyof typeof PLANS];
    if (!planId) return res.status(400).json({ message: "Invalid plan selected" });
    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
      return res.status(503).json({ message: "Billing is not yet configured on this server. Please contact support." });
    }

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        plan_id: planId,
        custom_id: req.user.id, // We embed our user ID to recognize them in webhooks
        application_context: {
          brand_name: "Costloci",
          locale: "en-US",
          shipping_preference: "NO_SHIPPING",
          user_action: "SUBSCRIBE_NOW",
          return_url: `${req.protocol}://${req.get("host")}/settings?success=true`,
          cancel_url: `${req.protocol}://${req.get("host")}/settings?canceled=true`
        }
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to create subscription");

    // Return the approval URL to redirect the user
    const approvalLink = data.links.find((link: any) => link.rel === "approve")?.href;
    res.json({ approvalUrl: approvalLink, subscriptionId: data.id });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Handle PayPal Webhooks (Live integration)
 */
billingRouter.post("/api/billing/paypal-webhook", async (req, res) => {
  try {
    const { event_type, resource } = req.body;
    
    // Live Revenue Protection: Strict Webhook Signature Verification
    const accessToken = await getPayPalAccessToken();
    const verifyResponse = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        auth_algo: req.headers['paypal-auth-algo'],
        cert_url: req.headers['paypal-cert-url'],
        transmission_id: req.headers['paypal-transmission-id'],
        transmission_sig: req.headers['paypal-transmission-sig'],
        transmission_time: req.headers['paypal-transmission-time'],
        webhook_id: process.env.PAYPAL_WEBHOOK_ID || "LIVE_WEBHOOK_ID",
        webhook_event: req.body
      })
    });
    
    const verifyData = await verifyResponse.json();
    if (verifyData.verification_status !== "SUCCESS") {
      console.warn("[Costloci Billing] SECURITY ALERT: Invalid Webhook Signature Rejected!");
      return res.status(403).json({ message: "Invalid Signature" });
    }
    
    if (event_type === "BILLING.SUBSCRIPTION.ACTIVATED" || event_type === "PAYMENT.SALE.COMPLETED") {
      const customId = resource.custom_id;
      const planId = resource.plan_id;
      
      let tier = "starter";
      if (planId === PLANS.pro) tier = "pro";
      if (planId === PLANS.enterprise) tier = "enterprise";

      if (customId) {
        await storage.updateUser(customId, { subscriptionTier: tier });
        console.log(`[Costloci Billing] Upgraded user ${customId} to ${tier} tier.`);

        // Audit Trail for Regulatory Compliance
        await storage.createAuditLog({
          userId: customId,
          action: "SUBSCRIPTION_UPGRADE",
          details: JSON.stringify({ plan_id: planId, tier: tier, status: "activated" }),
        });

        // Telemetry for MRR & ROI Tracking
        await storage.createBillingTelemetry({
          clientId: 0, // System-wide metric
          metricType: "mrr_capture",
          value: tier === 'pro' ? 299 : tier === 'enterprise' ? 999 : 99,
          cost: 0,
        });
      }
    }

    res.status(200).send("OK");
  } catch (err: any) {
    console.error("[Costloci Billing] Webhook Error:", err.message);
    res.status(500).send("Webhook Error");
  }
});

export default billingRouter;
