import { storage } from "../server/storage";

async function seed() {
  console.log("--- SEEDING EAST AFRICAN VENDOR BENCHMARKS ---");

  const benchmarks = [
    {
      serviceType: "24/7 Managed SOC (MDR)",
      serviceCategory: "security_operations",
      marketAverageAnnual: 32500,
      currency: "USD",
      region: "East Africa",
      sampleSize: 45
    },
    {
      serviceType: "Managed Firewall Service",
      serviceCategory: "network_security",
      marketAverageAnnual: 5800,
      currency: "USD",
      region: "East Africa",
      sampleSize: 62
    },
    {
      serviceType: "Endpoint Detection & Response (100 Seats)",
      serviceCategory: "endpoint_security",
      marketAverageAnnual: 6500,
      currency: "USD",
      region: "East Africa",
      sampleSize: 88
    },
    {
      serviceType: "Cloud Security Posture Management (CSPM)",
      serviceCategory: "cloud_security",
      marketAverageAnnual: 8200,
      currency: "USD",
      region: "East Africa",
      sampleSize: 31
    },
    {
      serviceType: "Vulnerability Management & Scanning",
      serviceCategory: "risk_assessment",
      marketAverageAnnual: 4200,
      currency: "USD",
      region: "East Africa",
      sampleSize: 54
    },
    {
      serviceType: "Managed Phishing & Awareness Training",
      serviceCategory: "human_layer_security",
      marketAverageAnnual: 2800,
      currency: "USD",
      region: "East Africa",
      sampleSize: 73
    },
    {
      serviceType: "Identity & Access Management (SSO/MFA)",
      serviceCategory: "identity_management",
      marketAverageAnnual: 7500,
      currency: "USD",
      region: "East Africa",
      sampleSize: 42
    },
    {
      serviceType: "Data Loss Prevention (DLP) - Standard",
      serviceCategory: "data_protection",
      marketAverageAnnual: 12000,
      currency: "USD",
      region: "East Africa",
      sampleSize: 28
    },
    {
      serviceType: "SIEM-as-a-Service",
      serviceCategory: "log_management",
      marketAverageAnnual: 24000,
      currency: "USD",
      region: "East Africa",
      sampleSize: 37
    }
  ];

  for (const b of benchmarks) {
    try {
      await storage.createVendorBenchmark(b as any);
      console.log(`[SUCCESS] Seeded: ${b.serviceType}`);
    } catch (err: any) {
      console.error(`[ERROR] Failed to seed ${b.serviceType}:`, err.message);
    }
  }

  console.log("--- SEEDING COMPLETE ---");
  process.exit(0);
}

seed().catch(err => {
  console.error("Fatal Seeding Error:", err);
  process.exit(1);
});
