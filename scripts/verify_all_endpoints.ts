import { fileURLToPath } from 'url';
import { adminClient } from '../server/services/supabase.js';


const BASE_URL = process.env.VITE_API_URL || 'http://127.0.0.1:3001';

async function verifyAllEndpoints() {
  console.log("=== STARTING COMPREHENSIVE ENDPOINT VERIFICATION ===");
  console.log(`📡 Target API Gateway: ${BASE_URL}`);

  const randomSuffix = Math.floor(Math.random() * 100000);
  const email = `test.api.ops.${randomSuffix}@cyberoptimize.ai`;
  const password = "SecurePassword123!";
  
  let authToken = "";
  let workspaceId = null;
  let sessionCookie = "";
  let csrfToken = "";

  try {
    // ----------------------------------------------------
    // PHASE 0: CSRF INITIALIZATION
    // ----------------------------------------------------
    console.log(`\n[Stage 0] Protocol Handshake - CSRF Setup`);
    const csrfRes = await fetch(`${BASE_URL}/api/csrf-token`);
    if (!csrfRes.ok) throw new Error("Failed to initialize CSRF Protocol.");
    const csrfData = await csrfRes.json();
    csrfToken = csrfData.token;
    const initialCookies = csrfRes.headers.get('set-cookie');
    if (initialCookies) sessionCookie += initialCookies.split(';')[0] + '; ';
    console.log(`✅ CSRF Token Acquired`);

    const buildHeaders = (base = {}) => ({
        ...base,
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken,
        'Cookie': sessionCookie
    });

    // ----------------------------------------------------
    // PHASE 1: AUTHENTICATION
    // ----------------------------------------------------
    console.log(`\n[Stage 1] Security & Auth - Provisioning Identity: ${email}`);
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ email, password, firstName: "Integration", lastName: "Tester" })
    });
    
    if (!regRes.ok) throw new Error(`Registration failed: ${regRes.status} ${await regRes.text()}`);
    console.log("✅ Registration (POST /api/auth/register)");
    
    // Bypass email confirmation for test user
    console.log(`[Stage 1.1] Bypassing email verification for ${email}...`);
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
    if (listError) throw listError;
    const newUser = users.find(u => u.email === email);
    if (newUser) {
      await adminClient.auth.admin.updateUserById(newUser.id, { email_confirm: true });
      console.log(`✅ User email confirmed via Admin Gateway`);
    }
    
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ email, password })
    });
    
    if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
    const loginData = await loginRes.json();
    authToken = loginData.token;
    const rawLoginCookies = loginRes.headers.get('set-cookie');
    if (rawLoginCookies) sessionCookie += rawLoginCookies.split(';')[0] + '; ';
    console.log("✅ Login Session (POST /api/auth/login)");

    const fetchOpts = {
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        } as Record<string, string>
    };
    if (sessionCookie) fetchOpts.headers['Cookie'] = sessionCookie;
    if (csrfToken) fetchOpts.headers['x-csrf-token'] = csrfToken;

    const userRes = await fetch(`${BASE_URL}/api/auth/user`, fetchOpts);
    if (!userRes.ok) throw new Error(`User Fetch failed`);
    console.log("✅ Identity Check (GET /api/auth/user)");

    // ----------------------------------------------------
    // PHASE 2: WORKSPACES & ORGS
    // ----------------------------------------------------
    console.log(`\n[Stage 2] Subsystem Boundaries (Workspaces & Organizations)`);
    const workspacesRes = await fetch(`${BASE_URL}/api/workspaces`, fetchOpts);
    if (!workspacesRes.ok) throw new Error(`Workspace Fetch failed: ${await workspacesRes.text()}`);
    const workspaces = await workspacesRes.json();
    console.log("✅ Workspaces (GET /api/workspaces)");

    if (!workspaces || workspaces.length === 0) {
        console.warn("⚠️ Warning: No default workspace created for user. Proceeding without specific workspace tests.");
    } else {
        workspaceId = workspaces[0].id;
        console.log(`✅ Default Workspace Verified (ID: ${workspaceId})`);
    }

    // ----------------------------------------------------
    // PHASE 3: REGULATORY INTELLIGENCE
    // ----------------------------------------------------
    console.log(`\n[Stage 3] Regulatory Intelligence Engine`);
    const dpoRes = await fetch(`${BASE_URL}/api/dpo/metrics`, fetchOpts);
    if (!dpoRes.ok) throw new Error(`DPO Metrics failed: ${dpoRes.status} ${await dpoRes.text()}`);
    const metricsData = await dpoRes.json();
    if (!metricsData.trendAnalysis) {
      console.error("❌ FAILED STAGE 3: Received Metrics Data:", JSON.stringify(metricsData, null, 2));
      throw new Error("Missing correct telemetry shape on DPO metrics object");
    }
    console.log("✅ DPO Dashboard Metrics (GET /api/dpo/metrics)");

    // ----------------------------------------------------
    // PHASE 4: E-SIGNATURE WEBHOOKS (Mock Notification)
    // ----------------------------------------------------
    console.log(`\n[Stage 4] Webhook & Integrations Network`);
    const signNowWebhookRes = await fetch(`${BASE_URL}/api/integrations/signnow/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // Webhooks typically don't share identical user auth tokens, treating as a 3rd party
        body: JSON.stringify({
            meta: { event: "document.update" },
            content: { id: "test-doc-123" }
        })
    });
    // Valid webhook handlers should always return 200 OK
    if (!signNowWebhookRes.ok) throw new Error(`SignNow Webhook failed: ${signNowWebhookRes.status} ${await signNowWebhookRes.text()}`);
    console.log("✅ External E-Signature Webhook (POST /api/integrations/signnow/webhook)");

    if (workspaceId) {
         // Create Slack Channel test
        const slackRes = await fetch(`${BASE_URL}/api/workspaces/${workspaceId}/notifications/channels`, {
            ...fetchOpts,
            method: 'POST',
            body: JSON.stringify({
                provider: "slack",
                webhookUrl: "https://hooks.slack.com/services/T0000/B000/XXXX",
                events: ["contract.uploaded"]
            })
        });
        if (!slackRes.ok) throw new Error(`Slack Channel Register failed: ${slackRes.status} ${await slackRes.text()}`);
        console.log("✅ Slack Endpoint Setup (POST /api/workspaces/:id/notifications/channels)");
    }


    // ----------------------------------------------------
    // WRAP UP
    // ----------------------------------------------------
    console.log(`\n🎉 ALL ENDPOINTS VERIFIED SUCCESSFULLY!`);
    process.exit(0);

  } catch (err: any) {
    console.error(`\n❌ ENDPOINT VERIFICATION FAILED: ${err.message}`);
    process.exit(1);
  }
}

verifyAllEndpoints();
