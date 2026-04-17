import axios from "axios";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export class PaystackService {
  /**
   * Initializes a transaction with Paystack.
   */
  static async initializeTransaction(email: string, amountDecimal: number, reference: string) {
    const amount = Math.round(amountDecimal * 100); // Kobo/Cents
    try {
      const response = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          email,
          amount,
          reference,
          callback_url: `${process.env.APP_URL}/api/billing/paystack/callback`
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );
      return response.data.data;
    } catch (error: any) {
      console.error("[PAYSTACK] Init failed:", error.response?.data || error.message);
      throw new Error("Payment initialization failed.");
    }
  }

  /**
   * Verifies a Paystack transaction.
   */
  static async verifyTransaction(reference: string) {
    try {
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
          }
        }
      );
      return response.data.data;
    } catch (error: any) {
      console.error("[PAYSTACK] Verify failed:", error.response?.data || error.message);
      throw new Error("Payment verification failed.");
    }
  }
}
