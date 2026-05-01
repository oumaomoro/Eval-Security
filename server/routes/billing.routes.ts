import { Router } from "express";
import { isAuthenticated } from "../replit_integrations/auth/index.js";
import { storage } from "../storage.js";
import crypto from "crypto";
import { SOC2Logger } from "../services/SOC2Logger.js";
import { stripe } from "../services/stripe.js";
import type Stripe from "stripe";

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
  console.info("[BILLING] INFO: PAYSTACK_SECRET_KEY not set — Paystack gateway skipped.");
}
if (!process.env.STRIPE_SECRET_KEY) {
  console.info("[BILLING] INFO: STRIPE_SECRET_KEY not set — Stripe gateway skipped. Active gateway: PayPal.");
}
if (!PLANS.starter || !PLANS.pro || !PLANS.enterprise) {
  console.warn("[BILLING] WARNING: One or more PAYPAL_*_PLAN_ID env vars not set — PayPal subscription creation will fail.");
}

const STRIPE_PLANS = {
  starter: process.env.STRIPE_STARTER_PRICE_ID,
  pro: process.env.STRIPE_PRO_PRICE_ID,
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID,
};

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
    const { planType, billingInterval = "monthly" } = req.body;
    const isAnnual = billingInterval === "annual";
    
    // Base prices (Monthly)
    const basePrices = {
       starter: 99,
       pro: 299,
       enterprise: 999
    };

    const monthlyPrice = basePrices[planType as keyof typeof basePrices] || (planType === "free" ? 0 : 99);
    const finalAmount = isAnnual ? (monthlyPrice * 12 * 0.8) : monthlyPrice; // 20% discount

    // 0. FREE TIER BYPASS
    if (planType === "free" || finalAmount === 0) {
      await storage.updateUser(req.user.id, { subscriptionTier: "free" });
      await SOC2Logger.logEvent(req, {
          action: "SUBSCRIPTION_FREE_ACTIVATED",
          userId: req.user.id,
          details: "Free Trial activated via Billing Hub."
      });
      return res.json({ success: true, message: "Free plan activated" });
    }

    // Mock response for tests to avoid external gateway calls
    if (process.env.NODE_ENV === "test") {
      return res.json({ 
        approvalUrl: "https://mock-gateway.costloci.local/approve", 
        subscriptionId: "sub_test_mock_123",
        reference: "ref_test_mock_123"
      });
    }

    // 1. PAYSTACK ENTERPRISE PATH
    if (PAYSTACK_SECRET_KEY) {
      const response = await fetch(`${PAYSTACK_API_BASE}/transaction/initialize`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: req.user.email,
          amount: Math.round(finalAmount * 100), 
          callback_url: `${req.protocol}://${req.get("host")}/billing?success=true`,
          metadata: {
            userId: req.user.id,
            planType,
            billingInterval,
            finalAmount
          }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Paystack initialization failed");
      
      return res.json({ 
        approvalUrl: data.data.authorization_url, 
        reference: data.data.reference
      });
    }

    // 2. STRIPE ENTERPRISE PATH
    if (process.env.STRIPE_SECRET_KEY) {
      const priceId = STRIPE_PLANS[planType as keyof typeof STRIPE_PLANS];
      if (!priceId) return res.status(400).json({ message: "Invalid plan selected for Stripe" });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        // In a real scenario, we'd use Stripe Coupons for the 20% annual discount if not pre-configured in Price IDs
        discounts: isAnnual ? [{ coupon: process.env.STRIPE_ANNUAL_COUPON_ID }] : [],
        success_url: `${req.protocol}://${req.get("host")}/settings?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get("host")}/settings?canceled=true`,
        client_reference_id: req.user.id,
        metadata: { userId: req.user.id, planType, billingInterval }
      });

      return res.json({ approvalUrl: session.url, sessionId: session.id });
    }

    // 3. PAYPAL FALLBACK
    const planId = PLANS[planType as keyof typeof PLANS];
    if (!planId) return res.status(400).json({ message: "Invalid plan selected" });
    
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
        custom_id: req.user.id,
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

    const approvalLink = data.links.find((link: any) => link.rel === "approve")?.href;
    
    await SOC2Logger.logEvent(req, {
        action: "SUBSCRIPTION_INITIATED",
        userId: req.user.id,
        details: `Checkout session created for ${planType} (${billingInterval}) via PayPal.`
    });

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
    let isVerified = false;
    
    if (process.env.NODE_ENV === "test") {
      isVerified = true; // Mock verification for tests
    } else {
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
      isVerified = verifyData.verification_status === "SUCCESS";
    }
    
    if (!isVerified) {
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

        // Audit Trail for Regulatory Compliance (SOC-2 Hardened)
        await SOC2Logger.logEvent(req as any, {
          userId: customId,
          action: "SUBSCRIPTION_UPGRADE",
          resourceType: "BillingProfile",
          resourceId: String(customId),
          details: `Tier upgraded to ${tier} (PayPal Event: ${event_type})`
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

        await SOC2Logger.logEvent(req as any, {
          userId: userId,
          action: "SUBSCRIPTION_UPGRADE_PAYSTACK",
          resourceType: "BillingProfile",
          resourceId: String(userId),
          details: `Tier upgraded to ${planType} (Reference: ${event.data.reference})`
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

/**
 * Handle Stripe Webhooks
 */
billingRouter.post("/api/billing/stripe-webhook", async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // If you use body parser with raw body, pass the raw buffer here
    // For now we assume req.body is already parsed, or handled via middleware
    event = stripe.webhooks.constructEvent(
      req.body, 
      sig as string, 
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err: any) {
    console.error("[Costloci Billing] Stripe Webhook Error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id || session.metadata?.userId;
      const planType = session.metadata?.planType;

      if (userId && planType) {
        await storage.updateUser(userId, { subscriptionTier: planType });
        console.log(`[Costloci Billing] Stripe: Upgraded user ${userId} to ${planType} tier.`);

        await SOC2Logger.logEvent(req as any, {
          userId: userId,
          action: "SUBSCRIPTION_UPGRADE_STRIPE",
          resourceType: "BillingProfile",
          resourceId: String(userId),
          details: `Tier upgraded to ${planType} (Session: ${session.id})`
        });

        await storage.createBillingTelemetry({
          clientId: 0,
          metricType: "mrr_capture_stripe",
          value: planType === 'pro' ? 299 : planType === 'enterprise' ? 999 : 99,
          cost: 0,
        });
      }
    }

    res.sendStatus(200);
  } catch (err: any) {
    console.error("[Costloci Billing] Stripe Webhook Processing Error:", err.message);
    res.status(500).send("Webhook Error");
  }
});

export default billingRouter;
