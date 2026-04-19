require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function auditWorkspaceId() {
  const tables = [
    'clients', 'contracts', 'risks', 'risk_register', 'compliance_audits', 
    'reports', 'vendor_scorecards', 'audit_logs', 'clause_library', 
    'savings_opportunities', 'comments', 'contract_comparisons', 
    'regulatory_alerts', 'infrastructure_logs', 'billing_telemetry', 
    'clauses', 'remediation_suggestions', 'playbooks', 
    'marketplace_listings', 'marketplace_purchases', 'notification_channels',
    'audit_rulesets', 'continuous_monitoring', 'remediation_tasks'
  ];

  try {
    await client.connect();
    console.log('🔍 Auditing workspace_id presence...');
    
    for (const t of tables) {
      const res = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = 'workspace_id'
      `, [t]);
      
      if (res.rows.length === 0) {
        console.warn(`⚠️ Table ${t} is MISSING workspace_id`);
      } else {
        console.log(`✅ Table ${t} has workspace_id`);
      }
    }
  } catch (err) {
    console.error('❌ Audit failed:', err.message);
  } finally {
    await client.end();
  }
}

auditWorkspaceId();
