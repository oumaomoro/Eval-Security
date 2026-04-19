import { storage } from "../server/storage";
import { adminClient as supabase } from "../server/services/supabase";
import { AIGateway } from "../server/services/AIGateway";
import * as dotenv from "dotenv";

dotenv.config();

async function verifyHealth() {
  console.log("🚀 STARTING CYBEROPTIMIZE ENTERPRISE HEALTH CHECK...");
  
  const results = {
    database: false,
    aiGateway: false,
    auth: false,
    storage: false
  };

  // 1. Database & Storage Layer
  try {
    const health = storage.getHealth();
    if (health.mode === "sovereign" && health.missingTables.length === 0) {
      console.log("✅ Database: Sovereign Mode Active (All Tables Verified)");
      results.database = true;
    } else {
      console.warn(`⚠️ Database: Degraded Mode. Missing: ${health.missingTables.join(", ")}`);
    }
  } catch (err: any) {
    console.error("❌ Database: Critical Failure.", err.message);
  }

  // 2. AI Gateway Fallback Check
  try {
    const testPrompt = "Respond with 'HEALTH_OK'";
    const response = await AIGateway.createCompletion({
      model: "gpt-4o",
      messages: [{ role: "user", content: testPrompt }]
    });

    if (response.includes("HEALTH_OK")) {
      console.log("✅ AI Gateway: Primary Path (OpenAI) OK");
      results.aiGateway = true;
    } else {
       console.warn("⚠️ AI Gateway: Unexpected Response.");
    }
  } catch (err: any) {
    console.error("❌ AI Gateway: Primary Path Failed.", err.message);
  }

  // 3. Supabase Auth Check
  try {
    const { data, error } = await supabase.auth.getSession();
    if (!error) {
      console.log("✅ Auth: Supabase Identity Engine OK");
      results.auth = true;
    }
  } catch (err: any) {
    console.error("❌ Auth: Supabase Connection Failed.", err.message);
  }

  console.log("\n--- HEALTH SUMMARY ---");
  console.table(results);

  if (Object.values(results).every(v => v)) {
    console.log("\n🟢 SYSTEM STABLE - READY FOR PRODUCTION");
    process.exit(0);
  } else {
    console.log("\n🔴 SYSTEM UNSTABLE - REVIEW DIAGNOSTICS");
    process.exit(1);
  }
}

verifyHealth();
