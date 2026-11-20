import { storage } from "../storage.js";
import { SOC2Logger } from "./SOC2Logger.js";

export const PAYPAL_API_BASE = process.env.NODE_ENV === "production"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

export const PLANS = {
  starter: process.env.PAYPAL_STARTER_PLAN_ID || "P-STARTER",
  pro: process.env.PAYPAL_PRO_PLAN_ID || "P-PRO",
  enterprise: process.env.PAYPAL_ENTERPRISE_PLAN_ID || "P-ENTERPRISE",
};

export async function getPayPalAccessToken(): Promise<string | null> {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_SECRET) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[BILLING] PayPal credentials missing — bypassing token retrieval.");
    }
    return null;
  }

  try {
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`
    ).toString("base64");

    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[BILLING] PayPal auth failed (${response.status}) — credentials may be for wrong environment (sandbox vs live).`);
      } else {
        console.error(`[BILLING] PayPal auth failed: ${response.status} ${text}`);
      }
      return null;
    }
    const data = await response.json();
    return data.access_token as string;
  } catch (err: any) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[BILLING] PayPal token fetch skipped in dev:", err.message);
    } else {
      console.error("[BILLING] PayPal token fetch error:", err.message);
    }
    return null;
  }
}

export class BillingService {
  /**
   * SOVEREIGN BILLING ENGINE: Sync PayPal Subscription status
   */
  static async syncPayPalSubscription(userId: string, subscriptionId: string): Promise<{ success: boolean; tier?: string; status: string }> {
    try {
      const accessToken = await getPayPalAccessToken();
      if (!accessToken) return { success: false, status: "CREDENTIALS_MISSING" };

      const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[BillingService] Sync fetch skipped or failed (${response.status}) for User ${userId}: ${errorData.message || response.statusText}`);
        } else {
          console.error(`[BillingService] Failed to fetch subscription ${subscriptionId}: ${errorData.message || response.statusText}`);
        }
        return { success: false, status: "FETCH_FAILED" };
      }

      const data = await response.json();
      const status = data.status; // ACTIVE, CANCELLED, EXPIRED, etc.
      const planId = data.plan_id;

      if (status === "ACTIVE") {
        let tier = "starter";
        if (planId === PLANS.pro) tier = "pro";
        if (planId === PLANS.enterprise) tier = "enterprise";

        await storage.updateUser(userId, { 
          subscriptionTier: tier,
          paypalSubscriptionId: subscriptionId,
          lastSyncAt: new Date().toISOString() as any
        });

        console.log(`[BillingService] Sync Success for User ${userId}: Tier ${tier}`);
        return { success: true, tier, status };
      } else {
        console.warn(`[BillingService] Sync Inactive for User ${userId}: Status ${status}`);
        return { success: false, status };
      }
    } catch (err: any) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[BillingService] Sync Warning for User ${userId}:`, err.message);
      } else {
        console.error(`[BillingService] Critical Sync Failure for User ${userId}:`, err.message);
      }
      return { success: false, status: "ERROR" };
    }
  }

  /**
   * SOVEREIGN BILLING ENGINE: Create PayPal Subscription
   */
  static async createPayPalSubscription(userId: string, planType: string, email: string): Promise<{ approvalUrl: string; subscriptionId: string }> {
    const planId = PLANS[planType as keyof typeof PLANS];
    if (!planId) throw new Error(`Invalid plan type: ${planType}`);

    const accessToken = await getPayPalAccessToken();
    if (!accessToken) {
      throw new Error("PayPal service unavailable: credentials not configured or authentication failed.");
    }
    const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: planId,
        custom_id: userId.toString(),
        subscriber: { email_address: email },
        application_context: {
          brand_name: "Costloci Enterprise",
          shipping_preference: "NO_SHIPPING",
          user_action: "SUBSCRIBE_NOW",
          return_url: `${process.env.FRONTEND_URL}/billing?success=true`,
          cancel_url: `${process.env.FRONTEND_URL}/billing?cancel=true`,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "PayPal subscription creation failed");
    }

    const data = await response.json();
    const approvalUrl = data.links.find((l: any) => l.rel === "approve")?.href;
    return { approvalUrl, subscriptionId: data.id };
  }

  /**
   * SOVEREIGN BILLING ENGINE: Initialize Paystack Transaction
   */
  static async initializePaystackTransaction(email: string, amount: number, callbackUrl: string, metadata: any): Promise<{ approvalUrl: string; reference: string }> {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100), // Kobo / Cents
        callback_url: callbackUrl,
        metadata,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Paystack initialization failed");

    return { 
      approvalUrl: data.data.authorization_url, 
      reference: data.data.reference 
    };
  }
}
