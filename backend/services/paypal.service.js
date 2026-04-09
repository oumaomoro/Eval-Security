import fetch from 'node-fetch'; // Polyfill or native depending on Node version
import { supabase } from '../services/supabase.service.js';

/**
 * Enterprise PayPal Service
 * Handles Subscription upgrades and explicitly generates Corporate Invoices for African/MEA audits.
 */
export class PayPalService {
  static getBaseUrl() {
    return process.env.PAYPAL_MODE === 'live' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com';
  }

  static async generateAccessToken() {
    const auth = Buffer.from(process.env.PAYPAL_CLIENT_ID + ':' + process.env.PAYPAL_CLIENT_SECRET).toString('base64');
    const response = await fetch(`${this.getBaseUrl()}/v1/oauth2/token`, {
      method: 'POST',
      body: 'grant_type=client_credentials',
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    const data = await response.json();
    return data.access_token;
  }

  /**
   * Generates a formal corporate invoice compliant with standard auditing requirements
   */
  static async createCorporateInvoice(userId, organizationName, planTier, amount) {
    const accessToken = await this.generateAccessToken();
    const invoiceNumber = `INV-${Date.now()}`;
    
    const invoicePayload = {
      detail: {
        invoice_number: invoiceNumber,
        invoice_date: new Date().toISOString().split('T')[0],
        currency_code: 'USD',
        memo: 'Enterprise SaaS Subscription for Costloci Compliance AI'
      },
      invoicer: {
        name: { given_name: 'Costloci', surname: 'Enterprise' },
        email_address: 'billing@costloci.com',
        website: 'https://costloci.com'
      },
      primary_recipients: [
        {
          billing_info: {
            name: { given_name: organizationName, surname: '' },
          }
        }
      ],
      items: [
        {
          name: `Costloci ${planTier} License`,
          description: `Annual subscription covering IRA, CMA, & Global compliance modules.`,
          quantity: '1',
          unit_amount: { currency_code: 'USD', value: amount.toString() }
        }
      ]
    };

    const response = await fetch(`${this.getBaseUrl()}/v2/invoicing/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(invoicePayload)
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('PayPal Invoicing Error:', data);
      throw new Error('Failed to generate corporate invoice');
    }

    // Save invoice reference to Database
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action_type: 'INVOICE_GENERATED',
      description: `Generated Corporate Invoice ${invoiceNumber} for ${planTier} tier.`,
    });

    return data; // Returns invoice metadata including HREF to send/publish
  }

  /**
   * Create standard checkout order
   */
  static async createOrder(amount, description) {
    const accessToken = await this.generateAccessToken();
    const url = `${this.getBaseUrl()}/v2/checkout/orders`;
    const payload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          description: description,
          amount: { currency_code: 'USD', value: amount }
        }
      ]
    };

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return await response.json();
  }

  static async capturePayment(orderId) {
    const accessToken = await this.generateAccessToken();
    const url = `${this.getBaseUrl()}/v2/checkout/orders/${orderId}/capture`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      method: 'POST'
    });

    return await response.json();
  }

  /**
   * ── PAYOUTS: MONETIZE SELLERS ──────────────────────────────────────────────
   * Sends net earnings (70%) to a marketplace seller's PayPal account.
   */
  static async sendPayout(amount, sellerEmail, memo = 'Marketplace Earnings - Costloci') {
    const accessToken = await this.generateAccessToken();
    const url = `${this.getBaseUrl()}/v1/payments/payouts`;
    
    const payoutPayload = {
      sender_batch_header: {
        sender_batch_id: `PAYOUT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        email_subject: 'You have a new payment from legal experts at Costloci!',
        email_message: memo
      },
      items: [
        {
          recipient_type: 'EMAIL',
          amount: { value: amount.toFixed(2), currency: 'USD' },
          receiver: sellerEmail,
          note: memo,
          sender_item_id: `ITEM-${Date.now()}`
        }
      ]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payoutPayload)
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[PayPal Service] Payout Failure:', JSON.stringify(data));
      throw new Error(`PayPal Payout failed: ${data.message || 'Unknown Error'}`);
    }

    return data;
  }

  /**
   * ── USAGE: MONETIZE AT SCALE ───────────────────────────────────────────────
   * Generates a PayPal invoice for monthly token consumption overages.
   */
  static async createUsageOverageInvoice(customerEmail, amount, tokenUsageDetail) {
    const accessToken = await this.generateAccessToken();
    
    // 1. Create Draft Invoice
    const invoicePayload = {
      detail: {
        invoice_number: `OVERAGE-${Date.now()}`,
        invoice_date: new Date().toISOString().split('T')[0],
        currency_code: 'USD',
        note: `Projected AI token consumption overage: ${tokenUsageDetail}`,
        term: 'Due on Receipt'
      },
      invoicer: {
        name: { given_name: 'Costloci', surname: 'Enterprise' },
        email_address: 'finance@Costloci.com'
      },
      primary_recipients: [{ billing_info: { email_address: customerEmail } }],
      items: [
        {
          name: 'AI Analysis Overage',
          description: `Token usage exceeding your current plan limit. Details: ${tokenUsageDetail}`,
          quantity: '1',
          unit_amount: { currency_code: 'USD', value: amount.toFixed(2) }
        }
      ],
      configuration: { allow_tip: false, tax_inclusive: true }
    };

    const response = await fetch(`${this.getBaseUrl()}/v2/invoicing/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(invoicePayload)
    });

    const draft = await response.json();
    if (!response.ok) throw new Error(`PayPal Invoice creation failed: ${draft.message}`);

    // 2. Send the Invoice immediately (Triggers email to customer)
    const sendResponse = await fetch(`${this.getBaseUrl()}/v2/invoicing/invoices/${draft.id}/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    return await sendResponse.json();
  }
}
