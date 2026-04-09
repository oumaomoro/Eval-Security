import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { supabase } from '../services/supabase.service.js';
import { PayPalService } from '../services/paypal.service.js';
import { InvoiceService } from '../services/invoice.service.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'costloci-secret-2026';
const commission_rate = 0.3; // 30% platform fee

// ── CONNECT: REGISTER AS A SELLER (PayPal-First) ───────────────────────────
router.post('/register-seller', authenticateToken, async (req, res) => {
  try {
    const { paypal_email } = req.body;
    if (!paypal_email) return res.status(400).json({ error: 'PayPal email is required for payouts.' });

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        is_seller: true,
        paypal_email,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (profileError) throw profileError;

    res.json({ success: true, message: 'PayPal payout account linked successfully.', data: profile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// ─────────────────────────────────────────────────────────────────────────────

// 1. Get all active marketplace items
router.get('/items', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('marketplace_items')
      .select('*')
      .eq('status', 'active')
      .order('sales_count', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Create a new marketplace listing (Seller)
router.post('/items', requireAuth, async (req, res) => {
  const { name, description, category, content, price } = req.body;

  try {
    const { data, error } = await supabase
      .from('marketplace_items')
      .insert([{
        seller_id: req.user.id,
        name,
        description,
        category,
        content,
        price,
        status: 'active'
      }])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2b. Create PayPal Order for a marketplace item (Step 1 of checkout)
router.post('/create-order', requireAuth, async (req, res) => {
  const { itemId } = req.body;
  try {
    const { data: item, error } = await supabase
      .from('marketplace_items')
      .select('name, price')
      .eq('id', itemId)
      .single();

    if (error || !item) return res.status(404).json({ error: 'Item not found' });

    const token = await PayPalService.generateAccessToken();
    const frontendUrl = process.env.FRONTEND_URL || 'https://Costloci.vercel.app';

    const orderRes = await fetch(`${PayPalService.getBaseUrl()}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'USD', value: item.price.toFixed(2) },
          description: `Costloci Marketplace: ${item.name}`,
          custom_id: `${itemId}|${req.user.id}`
        }],
        application_context: {
          brand_name: 'Costloci',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
          return_url: `${frontendUrl}/marketplace/success`,
          cancel_url: `${frontendUrl}/marketplace`
        }
      })
    });

    const orderData = await orderRes.json();
    if (!orderRes.ok) return res.status(orderRes.status).json({ error: 'PayPal order creation failed', details: orderData });

    const approvalLink = orderData.links?.find(l => l.rel === 'approve');
    res.json({ success: true, orderId: orderData.id, approval_url: approvalLink?.href });
  } catch (err) {
    console.error('[marketplace/create-order]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. Record a Sale (Buyer - Advanced PayPal Split)
router.post('/purchase', requireAuth, async (req, res) => {
  const { itemId, paypalOrderId } = req.body;

  try {
    // 1. Get item and seller details
    const { data: item, error: itemError } = await supabase
      .from('marketplace_items')
      .select('*, profiles(paypal_email, is_seller)')
      .eq('id', itemId)
      .single();

    if (itemError) throw itemError;
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const totalPrice = item.price;
    const commission = Math.round(totalPrice * commission_rate * 100) / 100;
    const netToSeller = totalPrice - commission;

    // 2. Automated PayPal Payout (70% share to seller)
    let payoutId = null;
    if (item.profiles?.paypal_email && item.profiles?.is_seller && paypalOrderId) {
      try {
        const payout = await PayPalService.sendPayout(
          netToSeller, 
          item.profiles.paypal_email,
          `Sale of item: ${item.name}`
        );
        payoutId = payout.batch_header?.payout_batch_id || 'PENDING';
      } catch (err) {
        console.error('[Marketplace] PayPal payout fail:', err.message);
      }
    }

    // 3. Record the sale
    const { data: sale, error: saleError } = await supabase
      .from('marketplace_sales')
      .insert([{
        item_id: itemId,
        seller_id: item.seller_id,
        buyer_id: req.user.id,
        amount: totalPrice,
        commission: commission,
        net_to_seller: netToSeller,
        paypal_payout_id: payoutId,
        status: payoutId ? 'transferred' : 'pending'
      }])
      .select()
      .single();

    if (saleError) throw saleError;

    // 4. GENERATE AND SEND PROFESSIONAL INVOICE (Phase 15 Innovation)
    try {
      await InvoiceService.finalizeAndSend({
        id: sale.id,
        customer_name: req.user.name || req.user.email.split('@')[0],
        customer_email: req.user.email,
        items: [{ description: `Access: ${item.name}`, amount: totalPrice }],
        total: totalPrice
      }, req.user.id, req.user.organization_id);
    } catch (invErr) {
      console.error('[Marketplace] Invoice generation deferred:', invErr.message);
    }

    // 5. Increment statistics
    await supabase.rpc('increment_sales_count', { item_uid: itemId });

    res.json({ success: true, data: sale });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Get Seller Statistics (PayPal-First)
router.get('/seller-stats', authenticateToken, async (req, res) => {
  try {
    const { data: sales, error } = await supabase
      .from('marketplace_sales')
      .select('amount, net_to_seller, commission, status, created_at')
      .eq('seller_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const totalRevenue = sales.reduce((sum, s) => sum + (s.net_to_seller || 0), 0);
    const totalSales = sales.length;

    res.json({
      success: true,
      stats: {
        total_revenue: totalRevenue,
        total_sales: totalSales,
        history: sales
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
