const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function introspect() {
  console.log("🔍 Introspecting Database Schema...");
  
  const sql = `
    SELECT 
      table_name, 
      column_name, 
      data_type 
    FROM 
      information_schema.columns 
    WHERE 
      table_schema = 'public' 
    ORDER BY 
      table_name, ordinal_position;
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
      // If exec_sql returns void, we can't get data back this way easily.
      // But we can try a different approach if it supports returning.
      console.error("❌ RPC failed to return data:", error.message);
      return;
    }
    
    // In some setups, exec_sql returns JSON. In others it returns void.
    // If it returns void, we can't see the results here.
    // Let's try an RPC that returns JSON if available.
    console.log("Raw Response Data:", data);
  } catch (err) {
    console.error("❌ Introspection error:", err.message);
  }
}

introspect();
