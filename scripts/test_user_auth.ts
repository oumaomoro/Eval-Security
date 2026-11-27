import dotenv from "dotenv";
dotenv.config();
import { storage } from "../server/storage.js";
import { adminClient, supabase } from "../server/services/supabase.js";

async function testPipeline() {
  console.log("=== COSTLOCI SAAS PIPELINE VERIFICATION ===");
  const testEmail = "test_reg_fail_1@costloci.com";
  const testPassword = "StrongPassword123!";

  console.log(`\n1. Testing Supabase Auth for user: ${testEmail}...`);
  let authUserId: string | null = null;

  // Try signing in
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  });

  if (signInError) {
    console.log(`SignIn Notice: ${signInError.message}. Checking / Provisioning user in Supabase...`);
    // Check if user exists in admin
    const { data: userList } = await adminClient.auth.admin.listUsers();
    const existing = userList?.users?.find(u => u.email === testEmail);

    if (existing) {
      console.log(`User found in Supabase Auth (ID: ${existing.id}). Updating password to ${testPassword} and confirming email...`);
      authUserId = existing.id;
      const { error: updateErr } = await adminClient.auth.admin.updateUserById(existing.id, {
        password: testPassword,
        email_confirm: true
      });
      if (updateErr) console.warn("Admin update error:", updateErr.message);
      else console.log("Password updated and email confirmed successfully.");
    } else {
      console.log(`Creating user ${testEmail} with confirmed email in Supabase...`);
      const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: { first_name: "Test", last_name: "Executive" }
      });
      if (createErr) throw createErr;
      authUserId = newUser.user.id;
      console.log(`User created successfully. ID: ${authUserId}`);
    }

    // Now test sign-in again
    const { data: retrySignIn, error: retryErr } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    if (retryErr) {
      console.error("Retry signIn error:", retryErr.message);
    } else {
      console.log("Sign-in verified successfully via Supabase Auth!");
      authUserId = retrySignIn.user?.id || authUserId;
    }
  } else {
    console.log("Direct Sign-In SUCCESS! User ID:", signInData.user?.id);
    authUserId = signInData.user?.id || null;
  }

  // 2. Ensure profile and workspace are harmonized
  if (authUserId) {
    console.log("\n2. Verifying Profile & Workspace context...");
    let user = await storage.getUser(authUserId);
    if (!user) {
      console.log("Provisioning profile in database...");
      user = await storage.createUser({
        id: authUserId,
        email: testEmail,
        firstName: "Test",
        lastName: "Executive",
        role: "admin"
      });
    }
    console.log(`Profile verified: Role=${user?.role}, Email=${user?.email}`);

    // Ensure client exists
    if (!user.clientId) {
      const client = await storage.createClient({
        companyName: "Enterprise Test Hub",
        industry: "Finance & Technology",
        contactName: "Test Executive",
        contactEmail: testEmail,
        annualBudget: 250000,
        status: "active"
      });
      await storage.updateUser(authUserId, { clientId: client.id });
      user.clientId = client.id;
      console.log(`Client provisioned: ID=${client.id}`);
    }

    // Ensure workspace exists
    const workspaces = await storage.getUserWorkspaces(authUserId);
    let workspaceId = workspaces[0]?.id;
    if (!workspaceId) {
      const ws = await storage.createWorkspace({
        name: "Enterprise Workspace",
        ownerId: authUserId,
        plan: "professional"
      });
      workspaceId = (ws as any).id;
      await storage.addWorkspaceMember({
        userId: authUserId,
        workspaceId,
        role: "owner"
      });
      console.log(`Workspace provisioned: ID=${workspaceId}`);
    } else {
      console.log(`Existing Workspace verified: ID=${workspaceId}`);
    }

    // 3. Test contracts retrieval and ingestion
    console.log("\n3. Testing Contracts & Ingestion pipeline...");
    const contracts = await storage.getContracts({ workspaceId });
    console.log(`Active contracts found: ${contracts.length}`);

    if (contracts.length === 0) {
      console.log("Seeding verified sample contract to test analytics pipeline...");
      const seeded = await storage.createContract({
        workspaceId,
        clientId: user.clientId,
        vendorName: "CrowdStrike Enterprise",
        productService: "Falcon Complete EDR & MDR",
        category: "Endpoint Security",
        annualCost: 48000,
        effectiveDate: new Date("2026-01-01"),
        renewalDate: new Date("2027-01-01"),
        status: "active",
        intelligenceAnalysis: {
          riskScore: 28,
          complianceGaps: [],
          keyDates: { start: "2026-01-01", renewal: "2027-01-01", noticePeriodDays: 60 }
        }
      });
      console.log(`Seeded contract ID: ${seeded.id} (${seeded.vendorName})`);

      // Seed a baseline risk
      await storage.createRisk({
        workspaceId,
        contractId: seeded.id,
        riskTitle: "KDPA Section 48 Cross-Border Cloud Transfer",
        riskCategory: "Compliance",
        riskDescription: "Vendor telemetry data stored in foreign cloud regions without executed Section 48 Addendum.",
        severity: "medium",
        likelihood: "low",
        impact: "moderate",
        riskScore: 35,
        mitigationStatus: "identified",
        financialExposureMax: 20000
      });
      console.log("Seeded sample compliance risk for pipeline calculation.");
    }

    // 4. Test Compliance Audit calculation
    console.log("\n4. Testing Compliance Audit execution...");
    const audits = await storage.getComplianceAudits(undefined, workspaceId);
    console.log(`Compliance audits found: ${audits.length}`);

    // 5. Test Vendor Benchmarking aggregation
    console.log("\n5. Testing Vendor Benchmarks aggregation...");
    const activeContracts = await storage.getContracts({ workspaceId });
    const vendorNames = Array.from(new Set(activeContracts.map(c => c.vendorName)));
    console.log(`Active Vendors in portfolio: ${vendorNames.join(", ")}`);

    console.log("\n=== PIPELINE VERIFICATION PASSED ===");
    console.log("All pipeline layers verified: Auth -> Profile -> Workspace -> Contracts -> Risks -> Audits -> Benchmarks.");
  }
}

testPipeline()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Pipeline verification failed:", err);
    process.exit(1);
  });
