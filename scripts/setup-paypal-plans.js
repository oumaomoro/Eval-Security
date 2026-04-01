import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve('./backend/.env') });

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'live';
const base = PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

async function generateAccessToken() {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    const res = await fetch(`${base}/v1/oauth2/token`, {
        method: 'POST',
        body: 'grant_type=client_credentials',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || 'Failed to get access token');
    return data.access_token;
}

async function createProduct(token) {
    const res = await fetch(`${base}/v1/catalogs/products`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
            name: "Costloci Enterprise SaaS",
            description: "AI-powered Contract & DPO Optimization SaaS",
            type: "SERVICE",
            category: "SOFTWARE",
        })
    });
    const data = await res.json();
    if(res.ok) return data.id;
    // IF already exists (based on exact name sometimes) you'd query, but for simplicity creating a new product
    console.warn("Product creation might have failed or duplicated. Error:", data);
    return data.id;
}

async function createPlan(token, productId, name, price, interval) {
    const res = await fetch(`${base}/v1/billing/plans`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify({
            product_id: productId,
            name: `Costloci ${name} - ${interval}`,
            description: `${name} ${interval} Subscription for Costloci`,
            status: "ACTIVE",
            billing_cycles: [{
                frequency: { interval_unit: interval.toUpperCase(), interval_count: 1 },
                tenure_type: "REGULAR",
                sequence: 1,
                total_cycles: 0, // Infinite
                pricing_scheme: { fixed_price: { value: price.toFixed(2), currency_code: "USD" } }
            }],
            payment_preferences: { auto_bill_outstanding: true, setup_fee: { value: "0", currency_code: "USD" }, setup_fee_failure_action: "CONTINUE", payment_failure_threshold: 3 }
        })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Failed to create plan ${name}: ` + JSON.stringify(data));
    return data.id;
}

async function run() {
    console.log(`🚀 Starting PayPal Product & Plan Auto-Provisioning... (${PAYPAL_MODE})`);
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) return console.error('❌ PayPal credentials missing');
    
    try {
        const token = await generateAccessToken();
        console.log(`✅ Authenticated with PayPal!`);
        
        console.log(`📦 Creating Base Product...`);
        const productId = await createProduct(token);
        if(!productId) {
            console.error("Failed to fetch product ID."); return;
        }
        console.log(`✅ Product Created: ${productId}`);
        
        const plansToCreate = [
            { id: 'STARTER_MONTH', name: 'Starter', price: 149, interval: 'month' },
            { id: 'STARTER_YEAR', name: 'Starter', price: 1430.40, interval: 'year' }, // 20% discount
            { id: 'PRO_MONTH', name: 'Professional', price: 399, interval: 'month' },
            { id: 'PRO_YEAR', name: 'Professional', price: 3830.40, interval: 'year' },
            { id: 'ENTERPRISE_MONTH', name: 'Enterprise', price: 999, interval: 'month' },
            { id: 'ENTERPRISE_YEAR', name: 'Enterprise', price: 9590.40, interval: 'year' }
        ];

        console.log(`\n⏳ Provisioning Subscription Plans...`);
        let envUpdates = [];
        
        for (const p of plansToCreate) {
             const planId = await createPlan(token, productId, p.name, p.price, p.interval);
             console.log(`✅ Created Plan [${p.name} ${p.interval}]: ${planId}`);
             envUpdates.push(`PAYPAL_PLAN_${p.id}=${planId}`);
        }

        console.log(`\n🎉 All Plans successfully provisioned! Add the following to your backend/.env:\n`);
        console.log(envUpdates.join('\n'));
        console.log(`\n`);

    } catch(err) {
        console.error('❌ Automation Error:', err);
    }
}

run();
