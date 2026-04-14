const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verifyProfiles() {
  console.log("🔍 Verifying 'profiles' table structure...");
  
  const { data, error, count } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);

  if (error) {
    console.error("❌ 'profiles' table check failed:", error.message);
  } else {
    console.log("✅ 'profiles' table exists and has 'id' column.");
    console.log("Sample ID:", data[0]?.id);
  }
}

verifyProfiles();
