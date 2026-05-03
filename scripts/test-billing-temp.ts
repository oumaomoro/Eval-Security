import { storage } from "../server/storage";

async function testBilling() {
    console.log("--- STARTING BILLING & TIER UPGRADE TEST ---");

    try {
        const users = await storage.getAllUsers();
        if (users.length === 0) {
            console.error("No users found in database to test with.");
            return;
        }

        const testUser = users[0];
        console.log(`Testing with user: ${testUser.email} (ID: ${testUser.id})`);
        console.log(`Current Tier: ${testUser.subscriptionTier}`);

        // 1. Test Free Tier Activation (if not already free)
        console.log("\n[STEP 1] Testing 'free' tier upgrade logic...");
        await storage.updateUser(testUser.id, { subscriptionTier: "free" });
        let updatedUser = await storage.getUser(testUser.id);
        console.log(`Updated Tier: ${updatedUser?.subscriptionTier}`);
        if (updatedUser?.subscriptionTier === "free") {
            console.log("✅ Free tier upgrade successful.");
        } else {
            console.error("❌ Free tier upgrade failed.");
        }

        // 2. Test Pro Tier Upgrade
        console.log("\n[STEP 2] Testing 'pro' tier upgrade logic...");
        const proTier = "pro";
        await storage.updateUser(testUser.id, { subscriptionTier: proTier });
        updatedUser = await storage.getUser(testUser.id);
        console.log(`Updated Tier: ${updatedUser?.subscriptionTier}`);
        if (updatedUser?.subscriptionTier === proTier) {
            console.log("✅ Pro tier upgrade successful.");
        } else {
            console.error("❌ Pro tier upgrade failed.");
        }

        // 3. Test Enterprise Tier Upgrade
        console.log("\n[STEP 3] Testing 'enterprise' tier upgrade logic...");
        const enterpriseTier = "enterprise";
        await storage.updateUser(testUser.id, { subscriptionTier: enterpriseTier });
        updatedUser = await storage.getUser(testUser.id);
        console.log(`Updated Tier: ${updatedUser?.subscriptionTier}`);
        if (updatedUser?.subscriptionTier === enterpriseTier) {
            console.log("✅ Enterprise tier upgrade successful.");
        } else {
            console.error("❌ Enterprise tier upgrade failed.");
        }

        // 4. Test Billing Telemetry Creation
        console.log("\n[STEP 4] Testing billing telemetry tracking...");
        try {
            await storage.createBillingTelemetry({
                workspaceId: 1, 
                clientId: testUser.clientId || 1,
                metricType: "mrr_capture_test",
                value: 999,
                cost: 0
            });
            console.log("✅ Billing telemetry recorded.");
        } catch (e: any) {
            console.error("❌ Billing telemetry failed:", e.message);
        }

        console.log("\n--- BILLING TESTS COMPLETED ---");

    } catch (error: any) {
        console.error("CRITICAL TEST FAILURE:", error.message);
    }
}

testBilling();
