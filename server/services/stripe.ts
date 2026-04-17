import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("STRIPE_SECRET_KEY is missing. Stripe integrations will fail.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock", {
  apiVersion: "2023-10-16" as any,
});

export class StripeService {
  /**
   * Reports usage to Stripe for metered billing.
   * This is used for 'Pro' and 'Enterprise' users who exceed their AI credit limits.
   */
  static async reportUsage(customerId: string, subscriptionItemId: string, quantity: number) {
    try {
      // Using the more universal and version-compatible UsageRecords resource
      await (stripe as any).subscriptionItems.createUsageRecord(subscriptionItemId, {
        quantity,
        timestamp: Math.floor(Date.now() / 1000),
        action: "set",
      });
      console.log(`[STRIPE] Usage reported for ${customerId}: ${quantity}`);
    } catch (error: any) {
      console.error(`[STRIPE] Failed to report usage for ${customerId}:`, error.message);
    }
  }

  /**
   * Creates a customer if one doesn't exist.
   */
  static async getOrCreateCustomer(email: string, name: string) {
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length > 0) {
      return customers.data[0];
    }
    return await stripe.customers.create({ email, name });
  }
}
