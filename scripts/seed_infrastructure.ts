import { storage } from "../server/storage.js";

async function seed() {
  console.log("🌱 Seeding Infrastructure Intelligence...");

  try {
    // 1. Create a mock cloud account
    const account = await (storage as any).createCloudAccount({
      workspaceId: 1, // Default workspace
      provider: "aws",
      accountName: "AWS Production (Global)",
      accountId: "1234-5678-9012",
      region: "us-east-1",
      status: "active"
    });

    console.log(`✅ Created Cloud Account: ${account.accountName}`);

    // 2. Create mock assets
    const assets = [
      { name: "prod-web-server-01", type: "compute", exposure: "public", severity: "medium" },
      { name: "prod-web-server-02", type: "compute", exposure: "public", severity: "medium" },
      { name: "customer-data-s3", type: "storage", exposure: "public", severity: "critical" },
      { name: "postgres-prod-db", type: "database", exposure: "private", severity: "none" },
      { name: "legacy-app-bucket", type: "storage", exposure: "public", severity: "high" },
      { name: "vpn-gateway", type: "network", exposure: "internal", severity: "none" }
    ];

    for (const a of assets) {
      await (storage as any).createInfrastructureAsset({
        workspaceId: 1,
        cloudAccountId: account.id,
        name: a.name,
        assetType: a.type,
        exposureType: a.exposure,
        resourceId: `res-${Math.random().toString(36).substring(7)}`,
        severity: a.severity,
        vulnerabilityCount: a.severity === 'critical' ? 12 : a.severity === 'high' ? 5 : 0
      });
    }

    console.log(`✅ Seeded ${assets.length} assets.`);

    // 3. Log a scan event
    await storage.createInfrastructureLog({
      workspaceId: 1,
      status: "detected",
      component: "AutonomicDiscovery",
      event: "Shadow Asset Detected",
      actionTaken: "Critical misconfiguration found in 'customer-data-s3'. Bucket has public read/write access. Auto-remediation ticket created."
    });

    console.log("🚀 Infrastructure seeding complete.");
  } catch (err: any) {
    console.error("❌ Seeding failed:", err.message);
  }
}

seed();
