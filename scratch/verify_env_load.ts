import "dotenv/config";

const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "JWT_SECRET", "VITE_API_URL", "FRONTEND_URL"];
let allPass = true;

console.log("--- 🕵️ ENV SYNC VERIFICATION ---");

required.forEach(key => {
  if (process.env[key]) {
    console.log(`✅ [PASS] ${key} is set`);
  } else {
    console.log(`❌ [FAIL] ${key} is MISSING`);
    allPass = false;
  }
});

if (allPass) {
  console.log("\n🚀 All critical production variables are synchronized.");
  process.exit(0);
} else {
  console.log("\n⚠️  Some environment variables are missing in .env.");
  process.exit(1);
}
