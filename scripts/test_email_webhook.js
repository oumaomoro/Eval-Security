import fetch from 'node-fetch';

/**
 * SIMULATED WEBHOOK PAYLOAD (Resend Format)
 * This script bypasses Svix verification locally by using the special bypass ID: "dummy_id_verify_only"
 * In production, Resend signs this payload and svix intercepts it.
 */

const LOCAL_WEBHOOK_URL = 'http://localhost:3001/api/integrations/email/webhook';

// Modify to your production URL if you want to test the live server
const TARGET_URL = process.env.LIVE ? 'https://api.costloci.com/api/integrations/email/webhook' : LOCAL_WEBHOOK_URL;

console.log(`🚀 Sending mock Resend Payload to ${TARGET_URL}...`);

const mockPayload = {
    // We use the exact ID we coded as an override bypass in the webhook handler to bypass the get() lookup
    id: 'dummy_id_verify_only',
    created_at: new Date().toISOString(),
    data: {
        email_id: "dummy_id_verify_only",
        from: "test-sender@example.com",
        to: "analyze@costloci.com",
        subject: "[TEST INGESTION] Master Services Agreement 2026",
    },
    // The structure Resend actually uses when it sends `email.received` event:
    type: "email.received"
};

async function runTest() {
    try {
        const response = await fetch(TARGET_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(mockPayload)
        });

        const resultText = await response.text();
        console.log(`\n✅ Status: ${response.status}`);
        
        try {
            const resultJson = JSON.parse(resultText);
            console.log('📦 JSON Payload Response:', JSON.stringify(resultJson, null, 2));
        } catch(e) {
            console.log('📦 Text Response:', resultText);
        }
        
    } catch (err) {
        console.error('❌ Request failed:', err.message);
    }
}

runTest();
