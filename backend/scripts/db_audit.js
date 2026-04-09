import { supabase } from '../services/supabase.service.js';

async function auditDB() {
  console.log('🔍 Starting Database Audit...');
  
  const tables = ['profiles', 'organizations', 'email_queue', 'audit_logs', 'contracts'];
  
  for (const table of tables) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .limit(1);
    
    if (error) {
      console.error(`❌ Table [${table}]: Error - ${error.message}`);
    } else {
      console.log(`✅ Table [${table}]: OK (Approx ${count} rows)`);
    }
  }
}

auditDB();
