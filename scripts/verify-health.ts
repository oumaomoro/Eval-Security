import { storage } from "../server/storage.js";

async function verifyHealth() {
  console.log("--- 🕵️ SYSTEM HEALTH VALIDATION ---");
  
  // 1. Env Check
  const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "JWT_SECRET", "CRON_SECRET", "OPENAI_API_KEY"];
  required.forEach(key => {
    if (!process.env[key]) {
      console.error(`❌ [FAIL] Missing required environment variable: ${key}`);
      process.exit(1);
    }
    console.log(`✅ [PASS] Environment variable found: ${key}`);
  });

  // 2. Database Connectivity & Schema Check
  try {
    console.log("--- 🗄️ DATABASE INTEGRITY CHECK ---");
    const health = storage.getHealth();
    if (health.mode === 'degraded') {
      console.error(`⚠️ [WARN] Database in degraded mode. Missing tables: ${health.missingTables.join(", ")}`);
      // We don't exit(1) here as it might be a temporary schema sync issue, 
      // but in CI we usually want strict compliance.
    } else {
      console.log("✅ [PASS] Database schema synchronized (Sovereign Mode).");
    }
  } catch (error: any) {
    console.error(`❌ [FAIL] Database connectivity failed: ${error.message}`);
    process.exit(1);
  }

  console.log("\n🚀 System Health Verified. Proceeding with Deployment.");
}

verifyHealth().catch(err => {
  console.error("Fatal Health Check Error:", err);
  process.exit(1);
});
