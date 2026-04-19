/**
 * Phase 26 Diagnosis Script
 * Checks ALL tables for workspace_id and existence of new feature tables.
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EXPECTED_TABLES = [
  'clients', 'contracts', 'risks', 'compliance_audits', 'reports',
  'vendor_scorecards', 'audit_logs', 'clause_library', 'savings_opportunities',
  'comments', 'contract_comparisons', 'regulatory_alerts', 'infrastructure_logs',
  'billing_telemetry', 'clauses', 'remediation_suggestions', 'playbooks',
  'marketplace_listings', 'marketplace_purchases', 'notification_channels'
];

async function diagnose() {
  console.log('🔍 Diagnosing Phase 26 Harmonization...\n');

  for (const table of EXPECTED_TABLES) {
    // Check if table exists and has workspace_id
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(0);

    if (error) {
      if (error.message.includes('does not exist')) {
        console.log(`❌ Table ${table} is MISSING.`);
      } else {
        console.log(`⚠️  Error querying ${table}: ${error.message}`);
      }
      continue;
    }

    // Check for workspace_id
    const { error: colError } = await supabase
      .from(table)
      .select('workspace_id')
      .limit(0);

    if (colError && colError.message.includes('column "workspace_id" does not exist')) {
      console.log(`❌ Table ${table} is missing workspace_id column.`);
    } else if (colError) {
      console.log(`⚠️  Table ${table} workspace_id check error: ${colError.message}`);
    } else {
      console.log(`✅ Table ${table} is harmonized.`);
    }
  }
}

diagnose().catch(console.error);
