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
    const testPrompt = "Respond with exactly 'HEALTH_OK'";
    const response = await AIGateway.createCompletion({
      model: "gpt-4o",
      messages: [{ role: "user", content: testPrompt }]
    });

    if (response.toLowerCase().includes("health_ok") || response.includes("sovereign_fallback")) {
      console.log(response.includes("sovereign_fallback") 
        ? "✅ AI Gateway: Sovereign Fallback Active (Healthy Isolation)" 
        : "✅ AI Gateway: Primary Path OK");
      results.aiGateway = true;
    } else {
       console.warn("⚠️ AI Gateway: Unexpected Response:", response);
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

  // 4. Supabase Storage Check
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) throw error;
    
    if (buckets.some(b => b.name === 'contracts')) {
      console.log("✅ Storage: 'contracts' bucket verified.");
      results.storage = true;
    } else {
      console.warn("⚠️ Storage: 'contracts' bucket missing. Attempting to create...");
      const { error: createError } = await supabase.storage.createBucket('contracts', {
        public: false,
        fileSizeLimit: 20971520, // 20MB
        allowedMimeTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      });
      if (createError) {
        console.error("❌ Storage: Bucket creation failed.", createError.message);
      } else {
        console.log("✅ Storage: 'contracts' bucket created successfully.");
        results.storage = true;
      }
    }
  } catch (err: any) {
    console.error("❌ Storage: Check failed.", err.message);
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
