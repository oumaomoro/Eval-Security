import fetch from 'node-fetch';

/**
 * Agile Paystack Payment Service
 * Handles transaction initialization and verification for Nigerian/African markets.
 */
class PaystackService {
  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY;
    this.baseUrl = 'https://api.paystack.co';
  }

  /**
   * Initialize a Paystack transaction
   * @param {Object} params { email, amount, metadata }
   * @returns {Promise<Object>} Initialization data including authorization_url
   */
  async initializeTransaction({ email, amount, metadata }) {
    if (!this.secretKey) {
      throw new Error('PAYSTACK_SECRET_KEY is not configured.');
    }

    const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100), // convert to kobo
        metadata,
        callback_url: `${process.env.FRONTEND_URL}/billing/success?gateway=paystack`
      })
    });

    const data = await response.json();
    if (!data.status) {
      throw new Error(data.message || 'Paystack initialization failed.');
    }

    return data.data;
  }

  /**
   * Verify a Paystack transaction by reference
   * @param {string} reference 
   * @returns {Promise<Object>} Transaction details
   */
  async verifyTransaction(reference) {
    if (!this.secretKey) {
      throw new Error('PAYSTACK_SECRET_KEY is not configured.');
    }

    const response = await fetch(`${this.baseUrl}/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`
      }
    });

    const data = await response.json();
    if (!data.status) {
      throw new Error(data.message || 'Paystack verification failed.');
    }

    return data.data;
  }
}

export default new PaystackService();
