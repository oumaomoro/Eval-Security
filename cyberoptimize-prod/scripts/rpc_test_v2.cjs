const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkRpc() {
  console.log("🚀 Testing 'exec_sql' RPC with { sql_query } argument...");
  
  const testSql = "SELECT 1;";
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: testSql });
    
    if (error) {
      console.error("❌ RPC failed:", error.message);
      if (error.message.includes('function "exec_sql" does not exist')) {
        console.log("💡 The function 'exec_sql' is truly missing.");
      }
    } else {
      console.log("✅ SUCCESS! 'exec_sql' is available.");
      console.log("Data:", data);
    }
  } catch (err) {
    console.error("❌ Unexpected error:", err.message);
  }
}

checkRpc();
