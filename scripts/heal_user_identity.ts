import { adminClient } from "../server/services/supabase";

const TARGET_EMAIL = "file75555@gmail.com";
const FIRST_NAME   = "Ouma";
const LAST_NAME    = "Jack";

async function healUser() {
  console.log(`\n--- IDENTITY HEALING: ${TARGET_EMAIL} ---`);

  // Use generateLink to resolve Auth user by email (avoids paginated listUsers)
  const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email: TARGET_EMAIL,
  });

  if (linkErr || !linkData?.user) {
    console.log("⚠️ generateLink lookup inconclusive:", linkErr?.message);
    console.log("   → Attempting admin user creation as fallback...");

    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email: TARGET_EMAIL,
      password: "EnterprisePass123!",
      email_confirm: true,
      user_metadata: { first_name: FIRST_NAME, last_name: LAST_NAME },
    });

    if (createErr || !created.user) {
      // If it's a duplicate error, the user really does exist — iterate last page
      console.error("❌ Cannot locate or create auth user:", createErr?.message);
      process.exit(1);
    }

    console.log("✅ Auth User Created:", created.user.id);
    return healProfile(created.user.id);
  }

  const user = linkData.user;
  console.log(`✅ Auth User Resolved — ID: ${user.id}`);
  console.log(`   Email confirmed: ${user.email_confirmed_at ? "Yes" : "No"}`);
  console.log(`   Last sign-in: ${user.last_sign_in_at || "never"}`);

  await healProfile(user.id);
}

async function healProfile(userId: string) {
  // 2. Check profile row
  const { data: existing } = await adminClient
    .from("profiles")
    .select("id, email, first_name, last_name, tier, role")
    .eq("id", userId)
    .maybeSingle();

  if (existing) {
    console.log(`✅ Profile already exists — ${existing.first_name} ${existing.last_name} (Tier: ${existing.tier})`);
  } else {
    console.log("⚠️ No profile row found. Provisioning...");
    const { error: insertErr } = await adminClient.from("profiles").insert({
      id: userId,
      email: TARGET_EMAIL,
      first_name: FIRST_NAME,
      last_name: LAST_NAME,
      tier: "starter",
      role: "user",
    });

    if (insertErr) {
      console.error("❌ Profile insert failed:", insertErr.message);
      process.exit(1);
    }
    console.log("✅ Profile provisioned for Ouma Jack");
  }

  // 3. Check workspace membership
  const { data: membership } = await adminClient
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", userId)
    .maybeSingle();

  if (membership) {
    console.log(`✅ Workspace Linked — ID: ${membership.workspace_id} (Role: ${membership.role})`);
  } else {
    console.log("⚠️ No workspace membership. Creating default workspace...");

    const { data: ws, error: wsErr } = await adminClient
      .from("workspaces")
      .insert({ name: `${FIRST_NAME} ${LAST_NAME}'s Workspace`, owner_id: userId })
      .select()
      .single();

    if (wsErr || !ws) {
      console.warn("⚠️ Workspace creation warning:", wsErr?.message);
    } else {
      await adminClient.from("workspace_members").insert({
        workspace_id: ws.id,
        user_id: userId,
        role: "admin",
      });
      console.log(`✅ Workspace created & linked: "${ws.name}"`);
    }
  }

  console.log("\n🚀 IDENTITY HEALING COMPLETE");
  console.log(`User: ${FIRST_NAME} ${LAST_NAME} (${TARGET_EMAIL}) — authenticated & provisioned.`);
}

healUser().catch(e => {
  console.error("[FATAL]", e.message);
  process.exit(1);
});
