import { adminClient } from '../server/services/supabase.js';

async function checkSchema() {
  console.log('🔍 Diagnostic: Checking clause_library schema...');
  
  // Attempt to select from clause_library
  const { data, error } = await adminClient.from('clause_library').select('*').limit(1);

  if (error) {
    console.error('❌ Error selecting from clause_library:', error.message);
  } else {
    console.log('✅ Successfully selected from clause_library.');
    
  // Explicitly check for applicable_standards in clause_library
  const { error: err2 } = await adminClient.from('clause_library').select('applicable_standards').limit(1);
  if (err2) {
    console.error('❌ clause_library.applicable_standards is MISSING:', err2.message);
  } else {
    console.log('✅ clause_library.applicable_standards is PRESENT.');
  }

  // Check the 'clauses' table as well
  const { error: errPlus } = await adminClient.from('clauses').select('applicable_standards').limit(1);
  if (errPlus) {
    console.log('ℹ️ clauses.applicable_standards is MISSING (This might be intended if it uses a different schema)');
  } else {
    console.log('✅ clauses.applicable_standards is PRESENT.');
  }

  }


  process.exit(0);
}

checkSchema();
