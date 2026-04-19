import { adminClient } from "../server/services/supabase";

async function verifyAuthFlows() {
  const testEmail = `verify_${Date.now()}@costloci.test`;
  const baseUrl = 'http://127.0.0.1:3200';
  const csrfUrl = `${baseUrl}/api/csrf-token`;
  const registerUrl = `${baseUrl}/api/auth/register`;
  const magicLinkUrl = `${baseUrl}/api/auth/magic-link`;

  console.log(`[VERIFY] Fetching CSRF Token...`);
  try {
    const csrfResponse = await fetch(csrfUrl);
    const { token } = await csrfResponse.json();
    const setCookie = csrfResponse.headers.get('set-cookie');
    
    if (!token || !setCookie) {
        console.error("❌ Failed to retrieve CSRF token/cookie");
        process.exit(1);
    }

    console.log(`[VERIFY] Testing Registration for ${testEmail}...`);
    const registerResponse = await fetch(registerUrl, {
      method: "POST",
      headers: { 
          "Content-Type": "application/json",
          "x-csrf-token": token,
          "Cookie": setCookie.split(';')[0]
      },
      body: JSON.stringify({
        email: testEmail,
        password: "Password123!",
        firstName: "Verify",
        lastName: "Test"
      })
    });

    if (registerResponse.status === 201) {
      console.log("✅ Registration Succeeded (201 Created)");
    } else {
      const error = await registerResponse.json();
      console.error(`❌ Registration Failed (${registerResponse.status}):`, error);
      process.exit(1);
    }

    console.log("[VERIFY] Validating Backend Provisioning...");
    const { data: profile, error: dbError } = await adminClient
      .from("profiles")
      .select("*")
      .eq("email", testEmail)
      .maybeSingle();

    if (dbError) {
      console.error("❌ Database Error during verification:", dbError.message);
      process.exit(1);
    }

    if (profile && profile.client_id) {
      console.log(`✅ Identity Provisioned & Healed (Client ID: ${profile.client_id})`);
    } else {
      console.error("❌ Identity Provisioning Failed: No Client ID found for user.");
      process.exit(1);
    }

    console.log(`[VERIFY] Testing Magic Link for ${testEmail}...`);
    const magicResponse = await fetch(magicLinkUrl, {
      method: "POST",
      headers: { 
          "Content-Type": "application/json",
          "x-csrf-token": token,
          "Cookie": setCookie.split(';')[0]
      },
      body: JSON.stringify({ email: testEmail })
    });

    if (magicResponse.ok) {
      console.log("✅ Magic Link Request Succeeded");
    } else {
      const error = await magicResponse.json();
      console.error(`❌ Magic Link Failed (${magicResponse.status}):`, error);
      process.exit(1);
    }

    console.log("\n🚀 AUTHENTICATION FLOWS CERTIFIED 100%");
  } catch (err: any) {
    console.error("[VERIFY] Critical Network/Process Failure:", err.message);
    process.exit(1);
  }
}

verifyAuthFlows();
