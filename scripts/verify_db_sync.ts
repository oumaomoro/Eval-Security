/**
 * Costloci DB Sync Verifier (REST-only, no pg direct connection needed)
 * Checks that all required tables exist in Supabase via REST API.
 * Run: npx tsx scripts/verify_db_sync.ts
 */
import { readFileSync } from "fs";
import { resolve } from "path";

try {
  const envFile = readFileSync(resolve(process.cwd(), ".env"), "utf-8");
  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
    if (match && !process.env[match[1]]) {
      let val = (match[2] || "").trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      process.env[match[1]] = val;
    }
  }
} catch { /* ok */ }

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// All tables the application references
const REQUIRED_TABLES = [
  "profiles",
  "clients",
  "contracts",
  "risks",
  "clauses",
  "clause_library",
  "compliance_audits",
  "audit_rulesets",
  "audit_logs",
  "savings_opportunities",
  "reports",
  "vendor_scorecards",
  "workspaces",
  "workspace_members",
  "comments",
  "contract_comparisons",
  "infrastructure_logs",
  "billing_telemetry",
  "regulatory_alerts",
  "remediation_suggestions",
  "remediation_tasks",
  "playbooks",
  "user_playbooks",
  "marketplace_listings",
  "marketplace_purchases",
  "continuous_monitoring",
  "vendor_benchmarks",
  "insurance_policies",
  "subscriptions",
  "notification_channels",
];

async function checkTable(table: string): Promise<{ table: string; exists: boolean; count?: number; error?: string }> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=count&limit=1`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_KEY,
          "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "count=exact",
        },
      }
    );

    if (res.status === 200 || res.status === 206) {
      const countHeader = res.headers.get("content-range");
      const count = countHeader ? parseInt(countHeader.split("/")[1] || "0") : 0;
      return { table, exists: true, count };
    } else if (res.status === 404 || res.status === 400) {
      const body = await res.text();
      if (body.includes("relation") && body.includes("does not exist")) {
        return { table, exists: false, error: "Table missing" };
      }
      return { table, exists: false, error: `HTTP ${res.status}: ${body.slice(0, 80)}` };
    } else {
      return { table, exists: false, error: `Unexpected HTTP ${res.status}` };
    }
  } catch (e: any) {
    return { table, exists: false, error: e.message };
  }
}

async function run() {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║   COSTLOCI DB SYNC VERIFICATION                          ║");
  console.log(`║   Target: ${SUPABASE_URL.slice(8, 42).padEnd(47)}║`);
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  const results = await Promise.all(REQUIRED_TABLES.map(checkTable));

  const missing: string[] = [];
  const present: string[] = [];

  for (const r of results) {
    if (r.exists) {
      console.log(`  ✅ ${r.table.padEnd(35)} (${r.count ?? "?"} rows)`);
      present.push(r.table);
    } else {
      console.log(`  ❌ ${r.table.padEnd(35)} MISSING — ${r.error}`);
      missing.push(r.table);
    }
  }

  console.log(`\n──────────────────────────────────────────────────────────`);
  console.log(`  ${present.length}/${REQUIRED_TABLES.length} tables verified`);

  if (missing.length > 0) {
    console.log(`\n⚠️  MISSING TABLES (${missing.length}):`);
    missing.forEach((t) => console.log(`     - ${t}`));
    console.log(`\n  ACTION: Run scripts/phase26_harmonize.sql in the Supabase SQL Editor to create missing tables.`);
    process.exit(1);
  } else {
    console.log(`\n🎉 DATABASE FULLY SYNCED — All ${REQUIRED_TABLES.length} tables confirmed!`);
    process.exit(0);
  }
}

run().catch((e) => {
  console.error("💥 FATAL:", e.message);
  process.exit(1);
});
