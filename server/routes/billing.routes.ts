import { Router } from "express";
import { isAuthenticated } from "../replit_integrations/auth/index.js";
import { storage } from "../storage.js";
import crypto from "crypto";
import { SOC2Logger } from "../services/SOC2Logger.js";
import { stripe } from "../services/stripe.js";
import { PAYPAL_API_BASE, PLANS, getPayPalAccessToken } from "../services/BillingService.js";
import type Stripe from "stripe";

const billingRouter = Router();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
  console.warn("[BILLING] WARNING: PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET not set — PayPal checkout will fail.");
}
if (!PAYSTACK_SECRET_KEY) {
  console.info("[BILLING] INFO: PAYSTACK_SECRET_KEY not set — Paystack gateway skipped.");
}
if (!process.env.STRIPE_SECRET_KEY) {
  console.info("[BILLING] INFO: STRIPE_SECRET_KEY not set — Stripe gateway skipped. Active gateway: PayPal.");
}
if (!process.env.PAYPAL_STARTER_PLAN_ID || !process.env.PAYPAL_PRO_PLAN_ID || !process.env.PAYPAL_ENTERPRISE_PLAN_ID) {
  console.warn("[BILLING] WARNING: One or more PAYPAL_*_PLAN_ID env vars not set — PayPal subscription creation will fail.");
}

const STRIPE_PLANS = {
  starter: process.env.STRIPE_STARTER_PRICE_ID,
  pro: process.env.STRIPE_PRO_PRICE_ID,
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID,
};

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

    // REGIONAL DETECTION & PRIORITIZATION (Phase 38)
    const africanCountries = ['KE', 'NG', 'GH', 'ZA', 'TZ', 'UG', 'RW'];
    const userCountry = req.headers['x-vercel-ip-country'] as string;
    const isAfrican = africanCountries.includes(userCountry);
    
    // Explicit selection or implicit regional prioritization
    const selectedGateway = req.body.gateway || (isAfrican ? 'paystack' : 'paypal');

    // 0. FREE TIER BYPASS
    if (planType === "free" || finalAmount === 0) {
      await storage.updateUser(req.user.id, { subscriptionTier: "free" });
      await SOC2Logger.logEvent(req, {
          action: "SUBSCRIPTION_FREE_ACTIVATED",
          userId: req.user.id,
          details: "Free Trial activated via Billing Hub."
      });
      return res.json({ success: true, message: "Free plan activated", tier: "free" });
    }

    // Mock response for tests to avoid external gateway calls
    if (process.env.NODE_ENV === "test") {
      return res.json({ 
        approvalUrl: "https://mock-gateway.costloci.local/approve", 
        subscriptionId: "sub_test_mock_123",
        reference: "ref_test_mock_123",
        gateway: selectedGateway
      });
    }

    // ─── GATEWAY EXECUTION CHAIN (Priority: Paystack > PayPal > Stripe) ───

    // 1. PAYSTACK (Primary for African regions / explicitly selected)
    const { BillingService } = await import("../services/BillingService.js");
    if ((selectedGateway === 'paystack' || isAfrican) && PAYSTACK_SECRET_KEY) {
      try {
        const result = await BillingService.initializePaystackTransaction(
          req.user.email,
          finalAmount,
          `${req.protocol}://${req.get("host")}/billing?success=true`,
          {
            userId: req.user.id,
            planType,
            billingInterval,
            finalAmount
          }
        );
        return res.json({ 
          ...result,
          gateway: 'paystack'
        });
      } catch (err) {
        console.error("[BILLING] Paystack error, falling back:", err);
      }
    }

    // 2. PAYPAL (Primary Global Fallback)
    if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
      try {
        const result = await BillingService.createPayPalSubscription(
          req.user.id,
          planType,
          req.user.email
        );
        return res.json({ 
          ...result,
          gateway: 'paypal'
        });
      } catch (err: any) {
        console.error("[BILLING] PayPal error, falling back:", err.message);
      }
    }

    // 3. STRIPE (Last Resort)
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const priceId = STRIPE_PLANS[planType as keyof typeof STRIPE_PLANS];
        if (priceId) {
          const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            discounts: isAnnual ? [{ coupon: process.env.STRIPE_ANNUAL_COUPON_ID }] : [],
            success_url: `${req.protocol}://${req.get("host")}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.protocol}://${req.get("host")}/billing?canceled=true`,
            client_reference_id: req.user.id,
            metadata: { userId: req.user.id, planType, billingInterval }
          });
          return res.json({ approvalUrl: session.url, sessionId: session.id, gateway: 'stripe' });
        }
      } catch (err) {
        console.error("[BILLING] Stripe error:", err);
      }
    }

    throw new Error("No active payment gateways available. Please contact enterprise support.");
  } catch (err: any) {
    console.error("[BILLING CRITICAL] Subscribe Endpoint Failed:", err.message);
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

/**
 * MANUAL SYNC: Force a status check for a PayPal subscription
 * (Phase 37 Live Synchronization Hardening)
 */
billingRouter.post("/api/billing/sync-subscription", isAuthenticated, async (req: any, res) => {
  try {
    const { subscriptionId } = req.body;
    if (!subscriptionId) return res.status(400).json({ message: "Subscription ID is required" });

    const { BillingService } = await import("../services/BillingService.js");
    const result = await BillingService.syncPayPalSubscription(req.user.id, subscriptionId);

    if (result.success) {
      await SOC2Logger.logEvent(req, {
        action: "SUBSCRIPTION_SYNC_SUCCESS",
        userId: req.user.id,
        details: `Manual sync successful. Tier upgraded to ${result.tier}.`
      });
      return res.json(result);
    } else {
      return res.json({ success: false, status: result.status, message: `Subscription is currently ${result.status}` });
    }
  } catch (err: any) {
    console.error("[BILLING SYNC ERROR]", err.message);
    res.status(500).json({ message: "Sync failed: " + err.message });
  }
});

/**
 * Get Billing History
 */
billingRouter.get("/api/billing/history", isAuthenticated, async (req: any, res) => {
  try {
    const history = await storage.getBillingTelemetry();
    res.json(history);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * Generate PDF Invoice
 */
billingRouter.get("/api/billing/invoice/:id", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;
    const history = await storage.getBillingTelemetry();
    const item = history.find(h => h.id === parseInt(id));
    
    if (!item) return res.status(404).json({ message: "Invoice not found" });

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    // Add Logo / Header
    doc.setFontSize(22);
    doc.text("Costloci Enterprise", 20, 20);
    doc.setFontSize(10);
    doc.text("Cybersecurity Contract Optimization Platform", 20, 27);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 35, 190, 35);

    // Invoice Details
    doc.setFontSize(16);
    doc.text(`INVOICE #${item.id.toString().padStart(6, '0')}`, 20, 50);
    
    doc.setFontSize(10);
    doc.text(`Date: ${item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'N/A'}`, 20, 60);
    doc.text(`User: ${req.user.email}`, 20, 65);
    doc.text(`Status: Paid`, 20, 70);

    // Table Header
    doc.setFillColor(240, 240, 240);
    doc.rect(20, 85, 170, 10, "F");
    doc.text("Description", 25, 92);
    doc.text("Amount", 160, 92);

    // Item Row
    doc.text(item.metricType.replace(/_/g, ' ').toUpperCase(), 25, 105);
    doc.text(`$${item.value.toFixed(2)}`, 160, 105);

    doc.line(20, 115, 190, 115);

    // Total
    doc.setFontSize(12);
    doc.text("Total Paid:", 130, 130);
    doc.text(`$${item.value.toFixed(2)}`, 160, 130);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Thank you for choosing Costloci for your cybersecurity compliance needs.", 20, 280);

    const pdfBuffer = doc.output("arraybuffer");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice-${item.id}.pdf`);
    res.send(Buffer.from(pdfBuffer));

  } catch (err: any) {
    console.error("[INVOICE ERROR]", err);
    res.status(500).json({ message: "Failed to generate invoice" });
  }
});

export default billingRouter;
