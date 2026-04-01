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
}
