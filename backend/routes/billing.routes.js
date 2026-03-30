import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { supabase, isSupabaseConfigured } from '../services/supabase.service.js';
import paystackService from '../services/paystack.service.js';
import { PayPalService } from '../services/paypal.service.js';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const router = express.Router();

const PAYPAL_BASE = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYSTACK_KEY = process.env.PAYSTACK_SECRET_KEY;

// Get PayPal access token
async function getPayPalToken() {
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const data = await response.json();
  return data.access_token;
}

// Plan definitions
const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    tier: 'starter',
    price: 149,
    currency: 'USD',
    billing_cycle: 'monthly',
    features: ['Up to 10 contracts', 'Compliance auditing', 'Basic risk analysis', 'Email support'],
    highlight: false
  },
  {
    id: 'pro',
    name: 'Professional',
    tier: 'pro',
    price: 399,
    currency: 'USD',
    billing_cycle: 'monthly',
    features: ['Up to 50 contracts', 'Full AI analysis', 'Clause intelligence', 'Cost optimization', 'Priority support'],
    highlight: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tier: 'enterprise',
    price: 999,
    currency: 'USD',
    billing_cycle: 'monthly',
    features: ['Unlimited contracts', 'Custom AI training', 'Dedicated account manager', 'API access', 'SLA guarantee'],
    highlight: false
  },
  {
    id: 'api',
    name: 'API Access',
    tier: 'api',
    price: 299,
    currency: 'USD',
    billing_cycle: 'monthly',
    features: ['Programmatic /analyze endpoint', 'Unrestricted keys', 'Integration support'],
    highlight: false
  }
];

// GET /api/billing/plans
router.get('/plans', authenticateToken, async (req, res) => {
  res.json({ success: true, data: PLANS });
});

// ── Shared fulfillment helper: upgrades the user to the specific tier ──
async function performFulfillment(user, planTier, supabase, isSupabaseConfigured) {
  const targetTier = planTier || 'pro';
  if (!isSupabaseConfigured() || user?.id === '00000000-0000-0000-0000-000000000000') {
    console.log(`[billing] Fulfillment: skipped for tier '${targetTier}' (mock user or Supabase not configured)`);
    return;
  }
  try {
    const { error: dbErr } = await supabase
      .from('profiles')
      .update({ 
        tier: targetTier, 
        upgraded_at: new Date().toISOString(),
        trial_used: true
      })
      .eq('id', user.id);
    if (dbErr) console.error('[billing] DB profile upgrade error:', dbErr.message);

    const { error: authErr } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { tier: targetTier },
    });
    if (authErr) console.error('[billing] Auth metadata upgrade error:', authErr.message);

    console.log(`[billing] User ${user.id} successfully upgraded to tier: ${targetTier}`);
  } catch (e) {
    console.error('[billing] Fulfillment exception:', e.message);
  }
}

// POST /api/billing/create-order
router.post('/create-order', authenticateToken, async (req, res) => {
  try {
    const bodyInterval = req.body.interval || req.body.billing_cycle;
    const interval = bodyInterval === 'annual' || bodyInterval === 'year' ? 'year' : 'month';
    const planId = req.body.plan_id;
    const plan = PLANS.find(p => p.id === planId);
    if (!plan) return res.status(400).json({ error: 'Invalid plan' });

    let finalPrice = plan.price;
    if (interval === 'year') {
      finalPrice = (plan.price * 12) * 0.80;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // ── STRIPE FLOW ──────────────────────────────────────────────────────────
    if (stripe) {
       console.log(`[billing] Creating Stripe Session for ${plan.name} (${interval})`);
       
       let stripePriceId;
       if (planId === 'starter') stripePriceId = interval === 'year' ? process.env.STRIPE_PRICE_STARTER_YEAR : process.env.STRIPE_PRICE_STARTER_MONTH;
       else if (planId === 'pro') stripePriceId = interval === 'year' ? process.env.STRIPE_PRICE_PRO_YEAR : process.env.STRIPE_PRICE_PRO_MONTH;
       else if (planId === 'enterprise') stripePriceId = interval === 'year' ? process.env.STRIPE_PRICE_ENTERPRISE_YEAR : process.env.STRIPE_PRICE_ENTERPRISE_MONTH;
       else if (planId === 'api') stripePriceId = interval === 'year' ? process.env.STRIPE_PRICE_API_YEAR : process.env.STRIPE_PRICE_API_MONTH;

       if (stripePriceId) {
         const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            customer_email: req.user.email,
            client_reference_id: req.user.id,
            line_items: [{ price: stripePriceId, quantity: 1 }],
            success_url: `${frontendUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${frontendUrl}/billing?cancelled=1`
         });
         return res.json({ success: true, approval_url: session.url });
       }
       console.warn(`[billing] Stripe configured but no price ID found for ${planId} (${interval}). Falling back to regular intent/paypal.`);
    }

    // ── MOCK FLOW: no credentials configured ───────────────────────
    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.warn('[billing] Credentials missing — returning mock order');
      const mockOrderId = `MOCK-${Date.now()}`;
      return res.json({
        success: true,
        order_id: mockOrderId,
        data: {
          id: mockOrderId,
          status: 'CREATED',
          links: [{ rel: 'approve', href: `${frontendUrl}/billing/success?token=${mockOrderId}&PayerID=MOCK_PAYER&mock=1`, method: 'GET' }],
        },
        _source: 'mock',
      });
    }

    // ── PAYSTACK FLOW (PROVISION) ──────────────────────────────────────────
    if (planId && process.env.PAYSTACK_SECRET_KEY) {
       console.log(`[billing] Initializing Paystack for ${plan.name}`);
       const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({
           email: req.user.email,
           amount: Math.round(finalPrice * 100), // Paystack expects kobo/cents
           currency: plan.currency === 'KES' ? 'KES' : 'USD', // Support regional currency
           metadata: { user_id: req.user.id, tier: plan.tier, plan_id: plan.id },
           callback_url: `${frontendUrl}/billing/success`
         })
       });
       
       const paystackData = await paystackRes.json();
       if (paystackData.status) {
         return res.json({ success: true, approval_url: paystackData.data.authorization_url, reference: paystackData.data.reference });
       }
    }

    // ── REAL PAYPAL FLOW ────────────────────────────────────────────────────
    const token = await getPayPalToken();
    if (!token) {
      return res.status(502).json({ error: 'Failed to authenticate with PayPal.' });
    }

    console.log(`[billing] Creating PayPal order for plan '${plan.name}' ($${plan.price})`);
    const ppRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: plan.id,
          description: `CyberOptimize ${plan.name} Plan — ${billing_cycle === 'annual' ? 'Annual' : 'Monthly'}`,
          amount: {
            currency_code: plan.currency,
            value: finalPrice.toFixed(2),
          },
        }],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: 'CyberOptimize',
              landing_page: 'LOGIN',
              user_action: 'PAY_NOW',
              payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
              return_url: `${frontendUrl}/billing/success`,
              cancel_url: `${frontendUrl}/billing?cancelled=1`,
            },
          },
        },
      }),
    });

    const order = await ppRes.json();
    if (!ppRes.ok) {
      console.error('[billing] PayPal order creation failed:', JSON.stringify(order, null, 2));
      return res.status(ppRes.status).json({ error: order.message || 'PayPal rejected the order', details: order });
    }

    // Try all possible link relations for approval
    const approvalLink = order.links?.find(l => l.rel === 'approve' || l.rel === 'payer-action' || l.rel === 'payer-action-url');
    console.log(`[billing] Order ${order.id} created — approved link: ${approvalLink?.href}`);

    return res.json({ success: true, order_id: order.id, data: order, approval_url: approvalLink?.href });
  } catch (err) {
    console.error('[billing] create-order exception:', err);
    res.status(500).json({ error: 'Failed to create payment order', details: err.message });
  }
});

// POST /api/billing/capture-order
router.post('/capture-order', authenticateToken, async (req, res) => {
  try {
    const { order_id } = req.body;
    if (!order_id) return res.status(400).json({ error: 'order_id is required' });

    // ── MOCK FLOW: honour mock orders locally ──────────────────────────────
    if (!CLIENT_ID || !CLIENT_SECRET || String(order_id).startsWith('MOCK-')) {
      console.log(`[billing] Mock capture for order ${order_id}`);
      await performFulfillment(req.user, 'pro', supabase, isSupabaseConfigured);
      return res.json({ success: true, status: 'COMPLETED', upgraded: true, _source: 'mock' });
    }

    // ── REAL PAYPAL FLOW ───────────────────────────────────────────────────
    const token = await getPayPalToken();
    const ppRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${order_id}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const capture = await ppRes.json();
    console.log(`[billing] Capture response for ${order_id}: status=${capture.status}`);

    if (capture.status === 'COMPLETED') {
      // Find the tier from the reference_id (plan id)
      const purchaseUnit = capture.purchase_units?.[0];
      const planId = purchaseUnit?.reference_id;
      const plan = PLANS.find(p => p.id === planId);
      const tier = plan?.tier || 'pro';

      await performFulfillment(req.user, tier, supabase, isSupabaseConfigured);
      
      // Generate Corporate Invoice for Auditing (African/MEA Corporate requirement)
      let invoiceUrl = null;
      try {
        const invoice = await PayPalService.createCorporateInvoice(
          req.user.id,
          req.user.user_metadata?.company_name || 'CyberOptimize Corporate Client',
          plan?.name || tier,
          plan?.price || 0
        );
        invoiceUrl = invoice.href; // Front-end can show this link to download the PDF invoice
      } catch (invErr) {
        console.error('[billing] Failed to generate corporate invoice:', invErr);
      }

      return res.json({ success: true, status: 'COMPLETED', data: capture, upgraded: true, tier, invoice_url: invoiceUrl });
    } else {
      return res.status(400).json({ success: false, status: capture.status, data: capture });
    }
  } catch (err) {
    console.error('[billing] capture-order exception:', err);
    res.status(500).json({ error: 'Failed to capture payment', details: err.message });
  }
});

// ── PAYSTACK GATEWAY ENDPOINTS ──

// POST /api/billing/paystack/initialize
router.post('/paystack/initialize', authenticateToken, async (req, res) => {
  try {
    const interval = req.body.interval || req.body.billing_cycle || 'month';
    const planId = req.body.plan_id;
    const plan = PLANS.find(p => p.id === planId);
    if (!plan) return res.status(400).json({ error: 'Invalid plan' });

    let finalPrice = plan.price;
    if (interval === 'year') {
      finalPrice = (plan.price * 12) * 0.80;
    }

    console.log(`[billing] Initializing Paystack for plan '${plan.name}' (${billing_cycle || 'monthly'})`);
    const data = await paystackService.initializeTransaction({
      email: req.user.email,
      amount: finalPrice,
      metadata: {
        user_id: req.user.id,
        plan_id: plan.id,
        tier: plan.tier
      }
    });

    res.json({ success: true, authorization_url: data.authorization_url, reference: data.reference });
  } catch (err) {
    console.error('[billing] Paystack initialize error:', err);
    res.status(500).json({ error: 'Failed to initialize Paystack transaction' });
  }
});

// POST /api/billing/paystack/verify
router.post('/paystack/verify', authenticateToken, async (req, res) => {
  try {
    const { reference } = req.body;
    if (!reference) return res.status(400).json({ error: 'Reference required' });

    console.log(`[billing] Verifying Paystack reference: ${reference}`);
    const data = await paystackService.verifyTransaction(reference);

    if (data.status === 'success') {
      const tier = data.metadata?.tier || 'pro';
      await performFulfillment(req.user, tier, supabase, isSupabaseConfigured);
      return res.json({ success: true, status: 'success', upgraded: true, tier });
    }

    res.status(400).json({ success: false, status: data.status, message: 'Transaction not successful' });
  } catch (err) {
    console.error('[billing] Paystack verify error:', err);
    res.status(500).json({ error: 'Failed to verify Paystack transaction' });
  }
});

// GET /api/billing/status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    if (!isSupabaseConfigured() || req.user.id === '00000000-0000-0000-0000-000000000000') {
      return res.json({
        success: true,
        data: { plan: 'Free', tier: 'free', status: 'active', amount: 0, currency: 'USD' }
      });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    const tier = profile?.tier || 'free';
    const plan = PLANS.find(p => p.tier === tier) || { name: 'Free', price: 0, currency: 'USD' };

    res.json({
      success: true,
      data: {
        plan: plan.name,
        tier: tier,
        status: 'active',
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: plan.price,
        currency: plan.currency
      }
    });
  } catch (err) {
    console.error('[billing] Status error:', err);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

// POST /api/billing/webhook/:provider
router.post('/webhook/:provider', async (req, res) => {
  const provider = req.params.provider;
  let eventId = null;

  try {
    // 1. Log the incoming webhook immediately
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('webhook_events').insert({
        provider: provider,
        event_type: req.body.type || req.body.event || 'unknown',
        payload: req.body,
        headers: req.headers
      }).select('id').single();
      if (!error && data) eventId = data.id;
    }

    // 2. Stripe Webhook handling for API Tier Subscriptions
    if (provider === 'stripe' && req.body.type === 'checkout.session.completed') {
       const session = req.body.data.object;
       const userId = session.client_reference_id;
       if (userId) {
          // If the product was API Tier, set api_access = true
          if (session.amount_total === 29900 || session.amount_total === 287000) { // e.g., $299 * 100
             await supabase.from('profiles').update({ api_access: true }).eq('id', userId);
          } else {
             // Otherwise assume regular fulfillment
             await performFulfillment({ id: userId }, 'pro', supabase, isSupabaseConfigured);
          }
       }
    }

    // 3. Paystack Webhook handling
    if (provider === 'paystack' && req.body.event === 'charge.success') {
       const data = req.body.data;
       const userId = data.metadata?.user_id;
       const targetTier = data.metadata?.tier || 'pro';
       if (userId) {
          await performFulfillment({ id: userId }, targetTier, supabase, isSupabaseConfigured);
       }
    }

    if (eventId) {
      await supabase.from('webhook_events').update({ processed: true, processed_at: new Date().toISOString() }).eq('id', eventId);
    }
    res.status(200).json({ received: true });
  } catch (err) {
    if (eventId) await supabase.from('webhook_events').update({ error: err.message }).eq('id', eventId);
    res.status(200).json({ received: true, error: err.message });
  }
});

// POST /api/billing/charge-export
router.post('/charge-export', authenticateToken, async (req, res) => {
  try {
    // Check tier
    const { data: profile } = await supabase.from('profiles').select('tier').eq('id', req.user.id).single();
    if (profile?.tier !== 'starter') {
      return res.json({ allowed: true, message: 'Free export for pro/enterprise' });
    }

    if (stripe) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 500, // $5.00
        currency: 'usd',
        metadata: { user_id: req.user.id, type: 'pdf_export' }
      });
      return res.json({ allowed: false, clientSecret: paymentIntent.client_secret });
    } else {
      // Mock payment bypass for local
      await supabase.from('export_charges').insert({ user_id: req.user.id, amount: 5.00 });
      return res.json({ allowed: true, message: 'export mock charge successful' });
    }

  } catch (err) {
    console.error('Charge export error:', err);
    res.status(500).json({ error: 'Failed to process export charge' });
  }
});

// ── ADMIN BILLING ENDPOINTS (PORTFOLIO MONITORING) ──

// GET /api/billing/admin/stats
router.get('/admin/stats', authenticateToken, async (req, res) => {
  try {
    // 1. check if user is admin
    const { data: profile } = await supabase.from('profiles').select('tier').eq('id', req.user.id).single();
    if (profile?.tier !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // 2. Aggregate stats
    const { data: profiles } = await supabase.from('profiles').select('tier, created_at');
    
    const stats = {
      total_users: profiles.length,
      tier_breakdown: {
        free: profiles.filter(p => p.tier === 'free').length,
        starter: profiles.filter(p => p.tier === 'starter').length,
        pro: profiles.filter(p => p.tier === 'pro').length,
        enterprise: profiles.filter(p => p.tier === 'enterprise').length,
        admin: profiles.filter(p => p.tier === 'admin').length
      },
      estimated_mrr: 
        (profiles.filter(p => p.tier === 'starter').length * 149) +
        (profiles.filter(p => p.tier === 'pro').length * 399) +
        (profiles.filter(p => p.tier === 'enterprise').length * 999)
    };

    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/billing/admin/subscriptions
router.get('/admin/subscriptions', authenticateToken, async (req, res) => {
  try {
    const { data: profile } = await supabase.from('profiles').select('tier').eq('id', req.user.id).single();
    if (profile?.tier !== 'admin') return res.status(403).json({ error: 'Admin access required' });

    const { data: subscriptions, error } = await supabase
      .from('profiles')
      .select('id, email, tier, upgraded_at, trial_used')
      .neq('tier', 'free')
      .order('upgraded_at', { ascending: false });
    
    if (error) throw error;
    res.json({ success: true, data: subscriptions || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
