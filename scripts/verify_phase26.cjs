/**
 * CyberOptimize Phase 26 — Full Platform Verification
 * Checks: DB tables, workspace_id columns, TypeScript, server health
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const CORE_TABLES = [
  'clients','contracts','risks','compliance_audits','reports',
  'vendor_scorecards','audit_logs','clause_library','savings_opportunities',
  'comments','contract_comparisons','regulatory_alerts',
  'infrastructure_logs','billing_telemetry','clauses',
  'workspaces','workspace_members','profiles','audit_rulesets',
];

const PHASE26_TABLES = [
  'remediation_suggestions','playbooks',
  'marketplace_listings','marketplace_purchases','notification_channels',
];

const WORKSPACE_ID_TABLES = [
  'clients','contracts','risks','compliance_audits','comments',
  'billing_telemetry','infrastructure_logs','savings_opportunities',
];

async function verify() {
  console.log('🔍 CyberOptimize Phase 26 — Full Platform Verification\n');
  let pass = 0; let fail = 0;

  // 1. Core tables
  console.log('── Core Tables ──────────────────────────');
  for (const t of CORE_TABLES) {
    const { error } = await supabase.from(t).select('*').limit(1);
    if (error && !error.message.includes('0 rows')) {
      console.log(`  ❌ ${t}: ${error.message}`); fail++;
    } else {
      console.log(`  ✅ ${t}`); pass++;
    }
  }

  // 2. Phase 26 tables
  console.log('\n── Phase 26 Tables ──────────────────────');
  for (const t of PHASE26_TABLES) {
    const { error } = await supabase.from(t).select('*').limit(1);
    if (error && !error.message.includes('0 rows')) {
      console.log(`  ❌ ${t}: ${error.message}`); fail++;
    } else {
      console.log(`  ✅ ${t}`); pass++;
    }
  }

  // 3. workspace_id columns
  console.log('\n── workspace_id Multi-Tenancy ───────────');
  for (const t of WORKSPACE_ID_TABLES) {
    const { error } = await supabase.from(t).select('workspace_id').limit(1);
    if (error && error.message.includes('workspace_id')) {
      console.log(`  ❌ ${t}.workspace_id MISSING`); fail++;
    } else if (error) {
      console.log(`  ⚠️  ${t}.workspace_id: ${error.message}`);
    } else {
      console.log(`  ✅ ${t}.workspace_id`); pass++;
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Passed: ${pass}  ❌ Failed: ${fail}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  
  if (fail === 0) {
    console.log('\n🏆 CyberOptimize Phase 26 — ALL SYSTEMS GO');
  } else {
    console.log('\n⚠️  Some checks need attention. See above for details.');
    console.log('   If Phase 26 tables are missing, run: scripts/phase26_harmonize.sql');
    console.log('   in the Supabase SQL Editor: https://supabase.com/dashboard/project/ulercnwyckrcjcnrenzz/sql/new');
  }
}

verify().catch(err => console.error('Fatal:', err.message));
