import { storage } from "../storage.js";
import { StripeService } from "../services/stripe.js";
import { SOC2Logger } from "../services/SOC2Logger.js";

/**
 * SOVEREIGN BILLING CRON
 * 
 * Runs every 24 hours to synchronize local AI usage telemetry 
 * with Stripe metered billing items.
 */
export async function runBillingSync() {
 console.log("[BILL_CRON] Starting Enterprise Usage Sync...");
 
 try {
 const subscriptions = await storage.getSubscriptions();
 
 for (const sub of subscriptions) {
 // 1. Check if user is over their limit
 if (sub.apiTokenUsage > sub.apiTokenLimit) {
 const overage = sub.apiTokenUsage - sub.apiTokenLimit;
 
 console.log(`[BILL_CRON] Workspace ${sub.workspaceId} reached overage: ${overage}`);

 if (sub.stripeSubscriptionId && sub.stripePriceId) {
 // 2. Report overage to Stripe (Metered Billing)
 // Fetch the actual subscription item ID from Stripe
 try {
 const stripeSub = await StripeService.getSubscription(sub.stripeSubscriptionId);
 if (stripeSub && stripeSub.items.data.length > 0) {
 const subscriptionItemId = stripeSub.items.data[0].id;
 
 await StripeService.reportUsage(
 sub.stripeSubscriptionId, 
 subscriptionItemId, 
 overage
 );
 } else {
 console.warn(`[BILL_CRON] No active items found for Stripe subscription ${sub.stripeSubscriptionId}`);
 }
 } catch (stripeErr: any) {
 console.error(`[BILL_CRON] Stripe fetch failed for ${sub.stripeSubscriptionId}:`, stripeErr.message);
 }

 await SOC2Logger.logEvent({ 
 headers: {},
 socket: { remoteAddress: "127.0.0.1" }
 } as any, {
 action: "METERED_BILLING_REPORTED",
 userId: "system",
 details: `Reported ${overage} tokens for Workspace ${sub.workspaceId}`
 });
 }
 }

 // 3. Reset Daily/Monthly Usage if specified by logic (Optional per business req)
 // For now, we keep it cumulative until the end of the billing cycle.
 }

 console.log("[BILL_CRON] Sync complete.");
 } catch (error: any) {
 console.error("[BILL_CRON] Sync failed:", error.message);
 }
}
