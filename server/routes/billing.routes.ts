import { Router } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { storage } from "../storage";
import crypto from "crypto";

const billingRouter = Router();

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_API_BASE = "https://api-m.paypal.com";

const PLANS = {
  starter: process.env.PAYPAL_STARTER_PLAN_ID,
  pro: process.env.PAYPAL_PRO_PLAN_ID,
  enterprise: process.env.PAYPAL_ENTERPRISE_PLAN_ID
};

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_API_BASE = "https://api.paystack.co";

if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
  console.warn("[BILLING] WARNING: PAYPAL_CLIENT_ID / PAYPAL_SECRET not set — PayPal checkout will fail.");
}
if (!PAYSTACK_SECRET_KEY) {
  console.warn("[BILLING] WARNING: PAYSTACK_SECRET_KEY not set — Paystack checkout will fail.");
}
if (!PLANS.starter || !PLANS.pro || !PLANS.enterprise) {
  console.warn("[BILLING] WARNING: One or more PAYPAL_*_PLAN_ID env vars not set — PayPal subscription creation will fail.");
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
    
    // Check if we should use Paystack (Priority if key exists)
    if (PAYSTACK_SECRET_KEY) {
      const response = await fetch(`${PAYSTACK_API_BASE}/transaction/initialize`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: req.user.email,
          amount: planType === 'enterprise' ? 99900 : planType === 'pro' ? 29900 : 9900, // Amount in Kobo/Cents
          callback_url: `${req.protocol}://${req.get("host")}/billing?success=true`,
          metadata: {
            userId: req.user.id,
            planType: planType,
            custom_fields: [
              { display_name: "Plan", variable_name: "plan", value: planType }
            ]
          }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Paystack initialization failed");
      
      return res.json({ 
        approvalUrl: data.data.authorization_url, 
        accessCode: data.data.access_code,
        reference: data.data.reference
      });
    }

    // Fallback to PayPal
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
        auth_algo: req.headers['paypal-auth-algo'] as string,
        cert_url: req.headers['paypal-cert-url'] as string,
        transmission_id: req.headers['paypal-transmission-id'] as string,
        transmission_sig: req.headers['paypal-transmission-sig'] as string,
        transmission_time: req.headers['paypal-transmission-time'] as string,
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

/**
 * Handle Paystack Webhooks
 */
billingRouter.post("/api/billing/paystack-webhook", async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return res.sendStatus(500);

    const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');
    if (hash !== req.headers['x-paystack-signature']) {
      console.warn("[Costloci Billing] SECURITY ALERT: Invalid Paystack Webhook Signature!");
      return res.sendStatus(400);
    }

    const event = req.body;
    if (event.event === 'charge.success') {
      const { userId, planType } = event.data.metadata;
      
      if (userId && planType) {
        await storage.updateUser(userId, { subscriptionTier: planType });
        console.log(`[Costloci Billing] Paystack: Upgraded user ${userId} to ${planType} tier.`);

        await storage.createAuditLog({
          userId: userId,
          action: "SUBSCRIPTION_UPGRADE_PAYSTACK",
          details: JSON.stringify({ reference: event.data.reference, tier: planType }),
        });

        await storage.createBillingTelemetry({
          clientId: 0,
          metricType: "mrr_capture_paystack",
          value: planType === 'pro' ? 299 : planType === 'enterprise' ? 999 : 99,
          cost: 0,
        });
      }
    }

    res.sendStatus(200);
  } catch (err: any) {
    console.error("[Costloci Billing] Paystack Webhook Error:", err.message);
    res.status(500).send("Webhook Error");
  }
});

export default billingRouter;
