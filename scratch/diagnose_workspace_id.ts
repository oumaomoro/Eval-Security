import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Manual .env loader
try {
  const envPath = resolve(process.cwd(), ".env");
  const envFile = readFileSync(envPath, "utf-8");
  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match && !process.env[match[1]]) {
      let val = match[2] || "";
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      process.env[match[1]] = val;
    }
  }
} catch (e) {}

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const tablesToCheck = [
  'workspaces',
  'workspace_members',
  'clients',
  'contracts',
  'compliance_audits',
  'audit_rulesets',
  'risks',
  'clause_library',
  'savings_opportunities',
  'reports',
  'vendor_scorecards',
  'audit_logs',
  'remediation_suggestions',
  'playbooks',
  'comments',
  'contract_comparisons',
  'regulatory_alerts',
  'infrastructure_logs',
  'billing_telemetry',
  'clauses',
  'remediation_tasks',
  'continuous_monitoring',
  'marketplace_listings',
  'marketplace_purchases'
];

async function diagnoseWorkspaceId() {
  console.log("🔍 Starting workspace_id diagnostic...");
  
  const results: Record<string, boolean> = {};
  const missing: string[] = [];

  for (const table of tablesToCheck) {
    try {
      const { error } = await supabase.from(table).select('workspace_id').limit(1);
      if (error) {
        if (error.message.includes('column "workspace_id" does not exist')) {
          console.log(`❌ Table '${table}' is MISSING 'workspace_id'`);
          results[table] = false;
          missing.push(table);
        } else {
          console.warn(`⚠️ Error checking table '${table}':`, error.message);
        }
      } else {
        console.log(`✅ Table '${table}' has 'workspace_id'`);
        results[table] = true;
      }
    } catch (err: any) {
      console.error(`❌ Unexpected error checking table '${table}':`, err.message);
    }
  }

  console.log("\n--- DIAGNOSTIC SUMMARY ---");
  console.log(`Total tables checked: ${tablesToCheck.length}`);
  console.log(`Tables with workspace_id: ${Object.values(results).filter(v => v).length}`);
  console.log(`Tables missing workspace_id: ${missing.length}`);
  if (missing.length > 0) {
    console.log("Missing tables:", missing.join(", "));
  }
  console.log("--------------------------\n");

  process.exit(0);
}

diagnoseWorkspaceId();
