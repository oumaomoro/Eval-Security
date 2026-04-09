import Stripe from 'stripe';
import { supabase } from './supabase.service.js';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

/**
 * Stripe Service: Handles Marketplace Payouts (Connect), Transfers, and Overage Invoicing.
 */
export class StripeService {
  
  /**
   * Creates a Stripe Connect Express account for a marketplace seller.
   */
  static async createConnectAccount(user) {
    if (!stripe) throw new Error('Stripe is not configured in this environment.');

    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US', // Default, should ideally be configurable or derived from profile
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: { user_id: user.id }
    });

    return account;
  }

  /**
   * Generates an onboarding link for a Stripe Connect account.
   */
  static async createAccountLink(accountId, returnUrl) {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.FRONTEND_URL}/marketplace/seller?refresh=1`,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return accountLink.url;
  }

  /**
   * Transfers funds (minus platform commission) to a seller's connected account.
   */
  static async transferToSeller(amountInCents, destinationAccountId, description) {
    if (!stripe) throw new Error('Stripe is moving in mock-only mode.');

    const transfer = await stripe.transfers.create({
      amount: amountInCents,
      currency: 'usd',
      destination: destinationAccountId,
      description: description
    });

    return transfer;
  }

  /**
   * Creates a one-off invoice item for usage overages (billed on the next subscription cycle).
   */
  static async addOverageInvoiceItem(customerId, amountInCents, description) {
    const invoiceItem = await stripe.invoiceItems.create({
      customer: customerId,
      amount: amountInCents,
      currency: 'usd',
      description: description
    });

    return invoiceItem;
  }
}
