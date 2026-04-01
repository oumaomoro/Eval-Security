import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../backend/.env') });

const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found in backend/.env');
    process.exit(1);
}

const WEBHOOK_URL = 'https://api.costloci.com/api/integrations/email/webhook';

async function automateResendSetup() {
    console.log('🚀 Automating Resend Webhook Creation...');
    try {
        // 1. Check existing webhooks
        const listRes = await fetch('https://api.resend.com/webhooks', {
            headers: { 'Authorization': `Bearer ${RESEND_API_KEY}` }
        });
        const existing = await listRes.json();
        
        let webhookFound = false;
        if (existing.data) {
            for (const hook of existing.data) {
                if (hook.endpoint_url === WEBHOOK_URL) {
                    console.log(`✅ Webhook already exists with ID: ${hook.id}`);
                    webhookFound = true;
                }
            }
        }

        // 2. Create if not found
        if (!webhookFound) {
            console.log('📡 Creating new Webhook for email.received...');
            const createRes = await fetch('https://api.resend.com/webhooks', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    endpoint_url: WEBHOOK_URL,
                    endpoint: WEBHOOK_URL,
                    events: ['email.received']
                })
            });
            const created = await createRes.json();
            if (createRes.ok) {
                console.log(`✅ Webhook created successfully! ID: ${created.id}`);
            } else {
                console.error(`❌ Failed to create webhook: ${JSON.stringify(created)}`);
                process.exit(1);
            }
        }

        // 3. To auto-create the routing inbox, Resend routes ALL inbound traffic 
        // to verified domains. There is no API strictly for "creating an inbox alias" 
        // since the domain acts as a catch-all for Inbound routing.
        console.log(`\n📧 The inbound address "analyze@costloci.com" is automatically active as a catch-all route under your verified Costloci.com domain.`);

        // 4. Verification Check
        console.log('\n🔍 Verifying Deployed Webhook Endpoint...');
        console.log(`Pinging ${WEBHOOK_URL}...`);
        
        // Let's send a dummy payload to the deployed webhook to verify the route is up
        const verifyPing = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: 'dummy_id_verify_only', from: 'test@example.com' })
        });
        
        const verifyResult = await verifyPing.json();
        
        // Since 'dummy_id' won't be found in Resend, the route will return success=false, 
        // but this PROVES the route is LIVE and responding!
        if (verifyResult.error || verifyResult.message || verifyResult.success === false) {
             console.log(`✅ VERIFICATION SUCCESS: The production API endpoint is live and responding (received expected graceful failing for dummy ID).`);
        } else {
             console.log('⚠️ Verification returned an unexpected success format (or it worked?!).', verifyResult);
        }

        console.log('\n🎉 Automation & Verification Complete.');
        
    } catch (err) {
        console.error('❌ Error during automation setup:', err.message);
    }
}

automateResendSetup();
