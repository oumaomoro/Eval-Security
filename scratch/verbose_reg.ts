import { adminClient } from '../server/services/supabase';
import { authStorage } from '../server/replit_integrations/auth/storage';
import { storage } from '../server/storage';
import { randomUUID } from 'crypto';

async function verboseReg() {
  const email = `diag_${Date.now()}@test.com`;
  const password = "Password123!";
  const firstName = "Diag";
  const lastName = "User";

  console.log(`--- VERBOSE REGISTRATION: ${email} ---`);

  try {
    console.log("1. Supabase Auth Create User...");
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName }
    });
    if (authError) throw authError;
    const userId = authData.user!.id;
    console.log("✅ Auth User ID:", userId);

    console.log("2. Provisioning Client...");
    const client = await storage.createClient({
      companyName: "Diag Corp",
      industry: "Testing",
      contactName: "Diag",
      contactEmail: email,
      status: "active"
    });
    console.log("✅ Client ID:", client.id);

    console.log("3. Provisioning Workspace...");
    const workspace = await storage.createWorkspace({
      name: "Diag Workspace",
      ownerId: userId,
      plan: "starter"
    });
    console.log("✅ Workspace ID:", workspace.id);

    console.log("4. Creating Membership...");
    const membership = await storage.addWorkspaceMember({
      userId,
      workspaceId: workspace.id,
      role: "owner"
    });
    console.log("✅ Membership ID:", membership.id);

    console.log("5. Upserting Profile...");
    const profile = await authStorage.upsertUser({
      id: userId,
      email,
      firstName,
      lastName,
      clientId: client.id,
      role: "admin"
    });
    console.log("✅ Profile Role recorded:", profile.role);

    console.log("6. Verifying DB Record directly...");
    // We'll use the profile object we just got, but let's do a fresh fetch
    const freshUser = await authStorage.getUser(userId);
    console.log("🔍 Fresh Profile Role:", freshUser?.role);
    console.log("🔍 Fresh Profile Email:", freshUser?.email);
    console.log("🔍 Fresh Profile ClientID:", freshUser?.clientId);

  } catch (err: any) {
    console.error("💥 FAILED:", err.message);
  }
}

verboseReg();
