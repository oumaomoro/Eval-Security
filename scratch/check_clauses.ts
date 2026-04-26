
import { adminClient } from '../server/services/supabase.js';

async function checkClauseLibrary() {
  console.log("Checking Clause Library content...");
  const { data, error } = await adminClient.from('clause_library').select('id, clause_name');
  if (error) {
    console.error("Error fetching library:", error.message);
  } else {
    console.log(`Library has ${data.length} items:`, data);
  }
}

checkClauseLibrary();
