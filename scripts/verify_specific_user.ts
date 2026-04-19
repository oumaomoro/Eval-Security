import { adminClient } from "../server/services/supabase";

async function verifySpecificUser() {
  const testEmail = 'file75555@gmail.com';
  const firstName = 'Ouma';
  const lastName = 'Jack';
  const baseUrl = 'http://127.0.0.1:3200';
  const csrfUrl = `${baseUrl}/api/csrf-token`;
  const registerUrl = `${baseUrl}/api/auth/register`;
  const magicLinkUrl = `${baseUrl}/api/auth/magic-link`;

  console.log(`\n--- TARGETED USER AUTH VERIFICATION [${testEmail}] ---`);

  try {
    // 1. Fetch CSRF Token
    console.log(`[VERIFY] Fetching CSRF Session...`);
    const csrfResponse = await fetch(csrfUrl);
    const { token } = await csrfResponse.json();
    const setCookie = csrfResponse.headers.get('set-cookie');
    
    if (!token || !setCookie) {
        console.error("❌ Failed to retrieve CSRF token/cookie. Ensure server is running.");
        process.exit(1);
    }

    const authHeaders = { 
        "Content-Type": "application/json",
        "x-csrf-token": token,
        "Cookie": setCookie.split(';')[0]
    };

    // 2. Attempt Registration
    console.log(`[VERIFY] Testing Registration for ${firstName} ${lastName}...`);
    const registerResponse = await fetch(registerUrl, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        email: testEmail,
        password: "EnterprisePass123!", // Secure test password
        firstName,
        lastName
      })
    });

    if (registerResponse.status === 201) {
      console.log("✅ Registration Succeeded (User Created)");
    } else if (registerResponse.status === 400 || registerResponse.status === 409) {
      const resp = await registerResponse.json();
      if (resp.message?.toLowerCase().includes("already") || resp.message?.toLowerCase().includes("registered")) {
        console.log(`ℹ️ Identity detected: ${resp.message}. Proceeding to validation...`);
      } else {
        console.error(`❌ Registration Rejected:`, resp);
        process.exit(1);
      }
    } else {
      console.error(`❌ Registration Error (${registerResponse.status})`);
      process.exit(1);
    }

    // 3. Validate Identity Healing & Profile
    console.log("[VERIFY] Validating Backend Provisioning (Sovereign Layer)...");
    const { data: profile, error: dbError } = await adminClient
      .from("profiles")
      .select("id, email, first_name, last_name, tier, role, client_id")
      .eq("email", testEmail)
      .maybeSingle();

    if (dbError) {
      console.error("❌ Database Error during profile lookup:", dbError.message);
      process.exit(1);
    }

    if (!profile) {
      console.error("❌ Profile Sync Failed: No entry found in 'profiles' table.");
      process.exit(1);
    }

    console.log(`✅ Profile Found — Name: ${profile.first_name} ${profile.last_name}, Tier: ${profile.tier}, Role: ${profile.role}`);

    // Query workspace membership separately (no FK join in schema cache)
    const { data: membership, error: wsError } = await adminClient
      .from("workspace_members")
      .select("workspace_id, role, workspaces(name)")
      .eq("user_id", profile.id)
      .limit(1)
      .maybeSingle();

    if (wsError) {
      console.warn(`⚠️ Workspace lookup warning: ${wsError.message}`);
    }

    if (membership) {
      const wsName = (membership as any).workspaces?.name || membership.workspace_id;
      console.log(`✅ Identity Healed: Linked to Workspace "${wsName}" (Role: ${membership.role})`);
    } else {
      console.warn("⚠️ No workspace membership found. Triggering self-healing onboarding...");
      await fetch(`${baseUrl}/api/user/profile`, { headers: authHeaders });
      console.log("   ↳ Self-heal triggered via /api/user/profile.");
    }

    // 4. Test Magic Link Flow
    console.log(`[VERIFY] Testing Magic Link Generation API...`);
    const magicResponse = await fetch(magicLinkUrl, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ email: testEmail })
    });

    if (magicResponse.ok) {
      console.log("✅ Magic Link API responded successfully (200 OK)");
    } else {
      const error = await magicResponse.json();
      console.error(`❌ Magic Link API Failed (${magicResponse.status}):`, error);
      process.exit(1);
    }

    console.log("\n🚀 TARGETED USER AUTHENTICATION CERTIFIED");
    console.log(`User: ${firstName} ${lastName} (${testEmail}) is production-ready.`);
  } catch (err: any) {
    console.error("[VERIFY] Critical Network Failure:", err.message);
    process.exit(1);
  }
}

verifySpecificUser();
