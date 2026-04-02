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

    // ── MOCK/SAFEGUARD FLOW ──────────────────────────────────────────────────
    if (!CLIENT_ID || !CLIENT_SECRET) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[billing] CRITICAL: Payment credentials missing in production environment.');
        return res.status(500).json({ error: 'Payment gateway is currently unavailable.' });
      }

      console.warn('[billing] Credentials missing (Dev Mode) — returning mock order');
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

    const envKey = `PAYPAL_PLAN_${plan.id.toUpperCase()}_${interval.toUpperCase()}`;
    const paypalPlanId = process.env[envKey];

    if (!paypalPlanId && process.env.NODE_ENV === 'production') {
      console.error(`[billing] CRITICAL: Missing PayPal Plan ID for ${envKey}`);
      return res.status(500).json({ error: `Payment plan configuration for ${plan.name} is missing. Please contact support.` });
    }

    // Fallback only for non-production environments to allow testing
    const finalPaypalId = paypalPlanId || process.env.PAYPAL_PLAN_PRO_MONTH;

    const { data: profile } = await supabase.from('profiles').select('paypal_subscription_id').eq('id', req.user.id).single();
    if (profile?.paypal_subscription_id) {
      console.log(`[billing] Revising existing PayPal subscription ${profile.paypal_subscription_id} to plan ${paypalPlanId}`);
      const ppRes = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions/${profile.paypal_subscription_id}/revise`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: finalPaypalId
        })
      });
      const reviseData = await ppRes.json();
      if (!ppRes.ok) return res.status(ppRes.status).json({ error: 'PayPal revision failed', details: reviseData });
      const approvalLink = reviseData.links?.find(l => l.rel === 'approve');
      return res.json({ success: true, order_id: profile.paypal_subscription_id, data: reviseData, approval_url: approvalLink?.href });
    } else {
      console.log(`[billing] Creating new PayPal subscription for plan '${plan.name}'`);
      const ppRes = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: finalPaypalId,
          custom_id: req.user.id,
          application_context: {
            brand_name: 'Costloci',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'SUBSCRIBE_NOW',
            return_url: `${frontendUrl}/billing/success`,
            cancel_url: `${frontendUrl}/billing?cancelled=1`
          }
        })
      });
      const subData = await ppRes.json();
      if (!ppRes.ok) return res.status(ppRes.status).json({ error: 'PayPal subscription failed', details: subData });
      const approvalLink = subData.links?.find(l => l.rel === 'approve');
      return res.json({ success: true, order_id: subData.id, data: subData, approval_url: approvalLink?.href });
    }
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
    const ppRes = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions/${order_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const subData = await ppRes.json();
    console.log(`[billing] Subscription response for ${order_id}: status=${subData.status}`);

    if (subData.status === 'ACTIVE' || subData.status === 'APPROVED') {
      const planId = subData.plan_id;
      const planTier = PLANS.find(p => process.env[`PAYPAL_PLAN_${p.id.toUpperCase()}_MONTH`] === planId || process.env[`PAYPAL_PLAN_${p.id.toUpperCase()}_YEAR`] === planId)?.tier || 'pro';

      await performFulfillment(req.user, planTier, supabase, isSupabaseConfigured);

      await supabase.from('profiles').update({
        paypal_subscription_id: order_id,
        billing_provider: 'paypal'
      }).eq('id', req.user.id);

      return res.json({ success: true, status: 'COMPLETED', data: subData, upgraded: true, tier: planTier });
    } else {
      return res.status(400).json({ success: false, status: subData.status, data: subData });
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

    console.log(`[billing] Initializing Paystack for plan '${plan.name}' (${interval || 'monthly'})`);
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

    // Use maybeSingle() to prevent 500 crashes if profile is missing
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('tier, plan')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error) throw error;

    // Reconciliation: handles legacy 'plan' vs new 'tier' column naming
    const tier = profile?.tier || profile?.plan || 'free';

    // Find matching plan metadata
    let planMatch = PLANS.find(p => p.tier === tier || p.id === tier);

    // Fallback if tier not in PLANS (e.g. 'free')
    if (!planMatch) {
      planMatch = { name: tier.charAt(0).toUpperCase() + tier.slice(1), price: 0, currency: 'USD' };
      if (tier === 'free') planMatch.name = 'Free';
    }

    res.json({
      success: true,
      data: {
        plan: planMatch.name,
        tier: tier,
        status: 'active',
        next_billing_date: profile?.trial_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: planMatch.price,
        currency: planMatch.currency
      }
    });
  } catch (err) {
    console.error('[billing] Status failure:', err.message);
    res.status(500).json({ error: 'Failed to fetch subscription status', details: err.message });
  }
});

// POST /api/billing/webhook/:provider
router.post('/webhook/:provider', async (req, res) => {
  const provider = req.params.provider;
  let eventId = null;
  let eventBody = req.body;

  try {
    // 1. Stripe Webhook Cryptographic Verification
    if (provider === 'stripe' && process.env.STRIPE_WEBHOOK_SECRET && stripe) {
      const sig = req.headers['stripe-signature'];
      try {
        // Verifies the event origin using the raw request body
        const event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
        eventBody = event;
      } catch (err) {
        console.error(`[billing] Stripe Webhook Signature Error: ${err.message}`);
        Sentry.captureException(err, { tags: { category: 'webhook_auth_failure' } });
        return res.status(400).send(`Webhook Signature Error: ${err.message}`);
      }
    }

    // 2. Audit Trail: Log the incoming verified event
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('webhook_events').insert({
        provider: provider,
        event_type: eventBody.type || eventBody.event || 'unknown',
        payload: eventBody,
        headers: req.headers
      }).select('id').single();
      if (!error && data) eventId = data.id;
    }

    console.log(`[billing] Processing ${provider} event: ${eventBody.type || eventBody.event}`);

    // 3. Automated Tier Fulfillment (Stripe)
    if (provider === 'stripe') {
      const session = eventBody.data.object;
      const userId = session.client_reference_id;
      const stripeCustomerId = session.customer;

      switch (eventBody.type) {
        case 'checkout.session.completed':
          if (userId) {
            // Map session amount to tier logic
            const amount = session.amount_total;
            let targetTier = 'pro';
            if (amount >= 99900) targetTier = 'enterprise';
            else if (amount >= 39900) targetTier = 'pro';
            else if (amount >= 14900) targetTier = 'starter';

            await supabase.from('profiles').update({
              stripe_customer_id: stripeCustomerId,
              stripe_subscription_id: session.subscription,
              billing_provider: 'stripe',
              tier: targetTier,
              upgraded_at: new Date().toISOString()
            }).eq('id', userId);

            await performFulfillment({ id: userId }, targetTier, supabase, isSupabaseConfigured);
          }
          break;

        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
        case 'customer.subscription.created':
          const sub = eventBody.data.object;
          // Subscription updates use customer ID for lookups
          if (stripeCustomerId) {
            const status = sub.status;
            const tier = status === 'active' || status === 'trialing' ? 'pro' : 'free';
            await supabase.from('profiles').update({
              stripe_subscription_id: sub.id,
              billing_provider: 'stripe',
              tier: tier,
              status_note: `Subscription status: ${status}`
            }).eq('stripe_customer_id', stripeCustomerId);
          }
          break;
      }
    }

    // 4. Paystack Webhook Fulfillment
    if (provider === 'paystack' && eventBody.event === 'charge.success') {
      const data = eventBody.data;
      const userId = data.metadata?.user_id;
      const targetTier = data.metadata?.tier || 'pro';
      if (userId) {
        await supabase.from('profiles').update({ billing_provider: 'paystack' }).eq('id', userId);
        await performFulfillment({ id: userId }, targetTier, supabase, isSupabaseConfigured);
      }
    }

    // 5. PayPal Webhook Fulfillment
    if (provider === 'paypal' && eventBody.event_type && eventBody.event_type.startsWith('BILLING.SUBSCRIPTION')) {
      const subId = eventBody.resource.id;
      const customId = eventBody.resource.custom_id;
      if (customId || subId) {
        const status = eventBody.resource.status;
        const tier = status === 'ACTIVE' ? 'pro' : 'free';
        const updateData = {
          paypal_subscription_id: subId,
          billing_provider: 'paypal',
          tier: tier,
          status_note: `Subscription status: ${status}`
        };
        if (status === 'CANCELLED' || status === 'EXPIRED') updateData.tier = 'free';

        if (customId) await supabase.from('profiles').update(updateData).eq('id', customId);
        else await supabase.from('profiles').update(updateData).eq('paypal_subscription_id', subId);
      }
    }

    // 5. Finalize Audit Logging
    if (eventId) {
      await supabase.from('webhook_events').update({
        processed: true,
        processed_at: new Date().toISOString()
      }).eq('id', eventId);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error(`[billing] Webhook processing exception: ${err.message}`);
    Sentry.captureException(err);
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
        api: profiles.filter(p => p.tier === 'api').length,
        admin: profiles.filter(p => p.tier === 'admin').length
      },
      estimated_mrr:
        (profiles.filter(p => p.tier === 'starter').length * 149) +
        (profiles.filter(p => p.tier === 'pro').length * 399) +
        (profiles.filter(p => p.tier === 'enterprise').length * 999) +
        (profiles.filter(p => p.tier === 'api').length * 299)
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
