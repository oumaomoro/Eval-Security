import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('./backend/.env') });

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_URL = process.env.NODE_ENV === 'production' 
    ? 'https://api.costloci.com/api/billing/webhook/stripe' 
    : 'https://api.costloci.com/api/billing/webhook/stripe'; // Forced targeting

async function registerStripeWebhook() {
    console.log(`🚀 Starting Stripe Webhook Auto-Registration...`);
    console.log(`🌍 Target URL: ${WEBHOOK_URL}`);

    if (!STRIPE_SECRET_KEY) {
        console.error('❌ STRIPE_SECRET_KEY missing from backend/.env');
        process.exit(1);
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY);

    try {
        // Required events for subscription billing sync
        const enabled_events = [
            'checkout.session.completed',
            'customer.subscription.created',
            'customer.subscription.updated',
            'customer.subscription.deleted'
        ];

        // Ensure we don't duplicate
        const existingEndpoints = await stripe.webhookEndpoints.list({ limit: 10 });
        const existing = existingEndpoints.data.find(endpoint => endpoint.url === WEBHOOK_URL);

        if (existing) {
            console.log(`⚠️ Webhook already exists for ${WEBHOOK_URL}.`);
            console.log(`🔗 Webhook ID: ${existing.id}`);
            console.log(`🔒 Secret (STRIPE_WEBHOOK_SECRET): ${existing.secret}`);
            return;
        }

        const endpoint = await stripe.webhookEndpoints.create({
            url: WEBHOOK_URL,
            enabled_events,
            description: 'Costloci Production Webhook'
        });

        console.log(`✅ Successfully Configured Stripe Webhook!`);
        console.log(`🔗 Webhook ID: ${endpoint.id}`);
        console.log(`🔒 Endpoint Secret (STRIPE_WEBHOOK_SECRET): ${endpoint.secret}`);
        console.log(`Please add this secret to your backend/.env as STRIPE_WEBHOOK_SECRET.`);
    } catch (error) {
        console.error('❌ Failed to register Stripe webhook:', error.message);
    }
}

registerStripeWebhook();
