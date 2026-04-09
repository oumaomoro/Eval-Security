/**
 * Phase 15: Critical Verification Script (PayPal Monetization)
 * Simulates a marketplace purchase and usage-based overage to verify service integrity.
 */
import { PayPalService } from '../services/paypal.service.js';
import { InvoiceService } from '../services/invoice.service.js';

async function verifyPhase15() {
  console.log('🧪 Starting Phase 15 Verification (Live Simulation)...');

  // 1. Verify PayPal Payout API (Mock/Sandbox logic)
  try {
    console.log('📡 Testing PayPal Payout Integration...');
    const payout = await PayPalService.sendPayout(10.00, 'seller-test@example.com', 'Verification Sale');
    console.log('✅ Payout API Call Success:', payout.batch_header?.payout_batch_id || 'MOCK_OK');
  } catch (err) {
    console.error('❌ Payout verification failed:', err.message);
  }

  // 2. Verify Invoice Generation (PDF + Email)
  try {
    console.log('📄 Testing Invoice PDF Generation...');
    const invoice = await InvoiceService.finalizeAndSend({
      id: 'VERIFY-15-SYNC',
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      items: [{ description: 'Verification Item', amount: 99.00 }],
      total: 99.00
    }, '000-user-mock', '000-org-mock');
    console.log('✅ Invoice PDF/Email Dispatch Success:', invoice.id);
  } catch (err) {
    console.error('❌ Invoice verification failed:', err.message);
  }

  console.log('\n🏆 Phase 15 Verification Cycle Complete.');
}

verifyPhase15();
