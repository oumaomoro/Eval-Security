import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load backend environment variables
dotenv.config({ path: path.resolve('./backend/.env') });

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'live';
const WEBHOOK_URL = 'https://backend-7tgq9hs.vercel.app/api/billing/webhook/paypal';

const base = PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

async function generateAccessToken() {
    try {
        const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
        const response = await fetch(`${base}/v1/oauth2/token`, {
            method: 'POST',
            body: 'grant_type=client_credentials',
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error_description || 'Failed to get access token');
        return data.access_token;
    } catch (error) {
        console.error('❌ Error generating access token:', error);
        process.exit(1);
    }
}

async function registerWebhook() {
    console.log(`🚀 Starting PayPal Webhook Auto-Registration...`);
    console.log(`🌍 Target URL: ${WEBHOOK_URL}`);
    
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        console.error('❌ PayPal credentials missing from backend/.env');
        process.exit(1);
    }

    const accessToken = await generateAccessToken();
    console.log(`✅ Authenticated with PayPal (${PAYPAL_MODE})`);

    try {
        const response = await fetch(`${base}/v1/notifications/webhooks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                url: WEBHOOK_URL,
                event_types: [
                    { name: "PAYMENT.SALE.COMPLETED" },
                    { name: "BILLING.SUBSCRIPTION.ACTIVATED" },
                    { name: "BILLING.SUBSCRIPTION.CANCELLED" }
                ]
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log(`✅ Successfully Configured PayPal Webhook!`);
            console.log(`🔗 Webhook ID: ${data.id}`);
            console.log(`You can now accept live subscription events.`);
        } else {
            if (data.name === 'WEBHOOK_URL_ALREADY_EXISTS') {
                 console.log(`⚠️ Webhook URL is already registered in PayPal.`);
            } else {
                 console.error('❌ Failed to create webhook:', data);
            }
        }
    } catch (error) {
         console.error('❌ Network error while registering webhook:', error);
    }
}

process.on('unhandledRejection', (err) => console.error(err));

registerWebhook();
