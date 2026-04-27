import "dotenv/config";
import { adminClient as supabase } from "../server/services/supabase.js";

const BASE_URL = process.env.VITE_API_URL || "http://127.0.0.1:3200";

async function testAuthReal() {
  console.log("=== 🔐 REAL AUTHENTICATION & AUTHORIZATION TEST SUITE ===");
  console.log(`📡 Target: ${BASE_URL}`);

  const random = Math.floor(Math.random() * 10000);
  const email = `auth.test.${random}@cyberoptimize.ai`;
  const password = "SecurePassword123!";
  
  let userToken: string = "";
  let workspaceId: number = 0;
  let csrfToken: string = "";
  let sessionCookie: string = "";

  try {
    // 1. CSRF Handshake
    console.log("\n[Step 1] Initializing CSRF Protocol...");
    const csrfRes = await fetch(`${BASE_URL}/api/csrf-token`);
    const csrfData = await csrfRes.json();
    csrfToken = csrfData.token;
    sessionCookie = csrfRes.headers.get('set-cookie')?.split(';')[0] || "";
    console.log("✅ CSRF Token Acquired");

    const getHeaders = (token?: string) => ({
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
      "Cookie": sessionCookie,
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    });

    // 2. Real Registration
    console.log(`\n[Step 2] Registering real user: ${email}...`);
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ email, password, firstName: "Auth", lastName: "Tester" })
    });
    
    if (!regRes.ok) throw new Error(`Registration failed: ${await regRes.text()}`);
    console.log("✅ User registered successfully.");

    // 3. Confirm Email (Admin Bypass)
    console.log("[Step 3] Confirming user email via Supabase Admin Client...");
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);
    if (!user) throw new Error("User not found in Supabase after registration.");
    await supabase.auth.admin.updateUserById(user.id, { email_confirm: true });
    console.log("✅ Email confirmed.");

    // 4. Real Login
    console.log("\n[Step 4] Attempting Login...");
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ email, password })
    });
    
    if (!loginRes.ok) throw new Error(`Login failed: ${await loginRes.text()}`);
    const loginData = await loginRes.json();
    userToken = loginData.token;
    sessionCookie += "; " + (loginRes.headers.get('set-cookie')?.split(';')[0] || "");
    console.log("✅ Login successful. JWT Session established.");

    // 4.1 Downgrade user to analyst to test RBAC
    console.log("[Step 4.1] Downgrading user to 'analyst' in 'profiles' table to test RBAC...");
    const { error: roleError } = await supabase.from('profiles').update({ role: 'analyst' }).eq('id', user.id);
    if (roleError) throw new Error(`Role downgrade failed: ${roleError.message}`);
    console.log("✅ User role updated to 'analyst'.");

    // 5. Multi-tenant Isolation Test
    console.log("\n[Step 5] Testing Multi-tenant Isolation...");
    const wsRes = await fetch(`${BASE_URL}/api/workspaces`, { headers: getHeaders(userToken) });
    const workspaces = await wsRes.json();
    workspaceId = workspaces[0].id;
    console.log(`✅ User belongs to Workspace ID: ${workspaceId}`);

    // Try accessing a random workspace ID (Authorization Bypass Check)
    const rogueWorkspaceId = 999999;
    console.log(`[Step 5.1] Attempting UNAUTHORIZED access to Workspace ${rogueWorkspaceId}...`);
    const rogueRes = await fetch(`${BASE_URL}/api/workspaces/${rogueWorkspaceId}/notifications/channels`, {
      method: "POST",
      headers: getHeaders(userToken),
      body: JSON.stringify({ provider: "slack", webhookUrl: "http://malicious.com" })
    });
    
    if (rogueRes.status === 403 || rogueRes.status === 401) {
      console.log(`✅ ACCESS REJECTED (${rogueRes.status}). Isolation verified.`);
    } else {
      throw new Error(`❌ SECURITY VULNERABILITY: Accessed unauthorized workspace with status ${rogueRes.status}`);
    }

    // 6. RBAC Role Test
    console.log("\n[Step 6] Testing RBAC Role Enforcement...");
    console.log("[Step 6.1] Attempting UNAUTHORIZED Admin action (Org Invite) as Viewer...");
    const inviteRes = await fetch(`${BASE_URL}/api/org/invite`, {
      method: "POST",
      headers: getHeaders(userToken),
      body: JSON.stringify({
        email: `rogue.${random}@cyberoptimize.ai`,
        role: "admin",
        firstName: "Rogue",
        lastName: "Admin"
      })
    });

    if (inviteRes.status === 403) {
      console.log("✅ RBAC REJECTED (403). Role enforcement verified.");
    } else {
      throw new Error(`❌ SECURITY VULNERABILITY: Non-admin user (analyst) reached admin endpoint (status: ${inviteRes.status})`);
    }

    console.log("✅ Identity Verified (role: analyst)");

    // 7. Cleanup
    console.log("\n[Step 7] Cleaning up test user...");
    await supabase.auth.admin.deleteUser(user.id);
    console.log("✅ Test environment cleaned.");

    console.log("\n🎉 AUTH & AUTHZ VERIFICATION SUCCESSFUL!");
    process.exit(0);

  } catch (err: any) {
    console.error(`\n❌ AUTH TEST FAILED: ${err.message}`);
    process.exit(1);
  }
}

testAuthReal();
