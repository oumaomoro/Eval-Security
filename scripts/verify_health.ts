import fetch from "node-fetch";

/**
 * PRODUCTION HEALTH CERTIFICATION
 * Verifies all critical platform subsystems are operational.
 */
async function verifyHealth() {
  const target = process.env.API_URL || "http://127.0.0.1:3001";
  console.log(`🚀 Certifying Service Health at ${target}...`);

  const checks = [
    { name: "Public Gateway", url: "/api/health" },
    { name: "Auth Service", url: "/api/auth/session" },
    { name: "DPO Metrics", url: "/api/dpo/metrics" },
    { name: "Insurance Hub", url: "/api/insurance/list" }
  ];

  let allPassed = true;

  for (const check of checks) {
    try {
      const res = await fetch(`${target}${check.url}`);
      if (res.ok || res.status === 401) { // 401 is OK for protected routes during health check
        console.log(`✅ ${check.name}: REACHABLE`);
      } else {
        console.warn(`❌ ${check.name}: FAILED (${res.status})`);
        allPassed = false;
      }
    } catch (e: any) {
      console.error(`❌ ${check.name}: UNREACHABLE (${e.message})`);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log("\n🎉 PLATFORM CERTIFIED: ALL SYSTEMS GO.");
    process.exit(0);
  } else {
    console.error("\n💀 CERTIFICATION FAILED: Critical subsystems offline.");
    process.exit(1);
  }
}

verifyHealth();
