

const BASE_URL = 'http://127.0.0.1:3001';

async function testAuthOps() {
  console.log("=== STARTING BACKEND INTEGRATION TESTS ===");
  
  const randomSuffix = Math.floor(Math.random() * 10000);
  const email = `test.api.${randomSuffix}@enterprise.dev`;
  const password = "SecurePassword123!";
  
  try {
    // 1. Test Registration & Provisioning
    console.log(`[1] Testing Registration for ${email}...`);
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName: "API", lastName: "Tester" })
    });
    
    if (!regRes.ok) {
        const errorText = await regRes.text();
        throw new Error(`Registration failed: ${regRes.status} ${errorText}`);
    }
    const regData = await regRes.json();
    console.log("✅ Registration successful. User object:", regData);

    // 2. Test Login & Session Generation
    console.log(`[2] Testing Login for ${email}...`);
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!loginRes.ok) {
        throw new Error(`Login failed: ${loginRes.status}`);
    }
    const loginData = await loginRes.json();
    console.log("✅ Login successful.");

    // 3. Test Protected DB Access (User Identity Profile)
    console.log(`[3] Testing Protected Session Retrieval...`);
    const sessionRes = await fetch(`${BASE_URL}/api/auth/user`, {
        method: 'GET',
        headers: { 
            'Authorization': `Bearer ${loginData.token || ''}`,
            'Cookie': loginRes.headers.get('set-cookie') || '' 
        }
    });

    if (!sessionRes.ok) throw new Error(`Session Retrieval failed: ${sessionRes.status}`);
    const sessionData = await sessionRes.json();
    console.log("✅ Session retrieved securely:", Object.keys(sessionData));
    
    if (!sessionData.clientId) {
        console.error("❌ CRITICAL ERROR: User missing clientId. DB Provisioning failed!");
        process.exit(1);
    } else {
        console.log(`✅ DB Integration Verified! Attached to Client ID: ${sessionData.clientId}`);
    }

    console.log("=== INTEGRATION TESTS PASSED ===");

  } catch (err) {
    console.error("❌ TEST FAILED:", err.message);
    process.exit(1);
  }
}

testAuthOps();
