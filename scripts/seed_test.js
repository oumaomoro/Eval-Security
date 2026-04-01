import { findSimilarGoldStandard } from './backend/services/vector.service.js';
import { generateEmbedding } from './backend/services/vector.service.js';
import { supabase } from './backend/services/supabase.service.js';

/**
 * SEED SCRIPT: Use this to quickly test the Gold Standard Vector Engine.
 * Run with: node seed_test.js
 */
async function seedAndTest() {
  console.log('🚀 Starting Gold Standard Vector Engine Test...');

  const goldClauses = [
    {
      standard_name: 'Costloci GDPR Standard v1',
      clause_category: 'data_deletion',
      clause_text: 'The processor shall delete all personal data within 30 days of contract termination and provide a certificate of destruction.'
    },
    {
      standard_name: 'Enterprise Liability Standard',
      clause_category: 'liability',
      clause_text: 'Liability shall be capped at 5x the annual fee for security breaches, with no cap for gross negligence.'
    }
  ];

  for (const clause of goldClauses) {
    console.log(`📡 Embedding: ${clause.standard_name}...`);
    const embedding = await generateEmbedding(clause_text);
    
    const { error } = await supabase
      .from('gold_standard_clauses')
      .insert([{ ...clause, embedding }]);
    
    if (error) console.error('❌ Failed to seed:', error.message);
    else console.log(`✅ Seeded: ${clause.standard_name}`);
  }

  // Test a "Risky" clause from a vendor contract
  const vendorClause = 'Wait, we will keep your data for 90 days after you leave and we only pay 1x the fee if we are hacked.';
  console.log(`🔍 Searching for matches to: "${vendorClause}"...`);
  
  const match = await findSimilarGoldStandard(vendorClause);
  if (match) {
    console.log(`🎯 Match Found! Similarity: ${Math.round(match.similarity * 100)}%`);
    console.log(`📄 Standard: ${match.standard_name}`);
    console.log(`📜 Gold Text: ${match.clause_text}`);
  } else {
    console.log('❌ No high-similarity match found.');
  }
}

// seedAndTest(); // Uncomment to run
