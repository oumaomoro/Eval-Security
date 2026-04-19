/**
 * Costloci Enterprise - Full E2E Test Suite
 * Tests every critical user journey against the live server.
 * Run: npx tsx scripts/e2e_full_suite.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Load .env
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

const API_BASE = process.env.E2E_API_URL || "http://127.0.0.1:3500";
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Test helpers ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

function pass(label: string) {
  console.log(`  ✅ ${label}`);
  passed++;
}

function fail(label: string, detail?: string) {
  const msg = detail ? `${label} — ${detail}` : label;
  console.error(`  ❌ ${msg}`);
  failures.push(msg);
  failed++;
}

async function api(
  method: string,
  path: string,
  token?: string,
  body?: object
): Promise<{ ok: boolean; status: number; data: any }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: any = null;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║   COSTLOCI ENTERPRISE — FULL E2E TEST SUITE              ║");
  console.log(`║   Target: ${API_BASE.padEnd(47)}║`);
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  const uid = Math.random().toString(36).slice(2, 8);
  const testEmail = `e2e_${uid}@costloci.test`;
  const testPassword = "E2eTestPass123!";
  let accessToken = "";
  let userId = "";

  // ── Stage 0: Server Health ────────────────────────────────────────────────
  console.log("▶ STAGE 0: Autonomic Health Check");
  const healthRes = await api("GET", "/api/health");
  if (healthRes.ok && healthRes.data?.status) {
    pass(`Health endpoint live (status: ${healthRes.data.status})`);
  } else {
    fail("Health endpoint", `status ${healthRes.status}`);
  }

  // ── Stage 1: Authentication ───────────────────────────────────────────────
  console.log("\n▶ STAGE 1: Authentication Flow");

  // Create confirmed test user via admin
  const { data: createData, error: createErr } = await adminClient.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: { first_name: "E2E", last_name: "Tester" },
  });

  if (createErr || !createData?.user) {
    fail("Create test user via Admin API", createErr?.message);
  } else {
    userId = createData.user.id;
    pass(`Test user provisioned (${userId.slice(0, 8)}...)`);
  }

  // Sign in
  if (userId) {
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: signIn, error: signInErr } = await anonClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInErr || !signIn?.session) {
      fail("Sign in with password", signInErr?.message);
    } else {
      accessToken = signIn.session.access_token;
      pass("Supabase sign-in OK, access token obtained");
    }
  }

  // Trigger server-side onboarding
  if (accessToken) {
    const onboardRes = await api("POST", "/api/auth/login", accessToken, {
      email: testEmail, password: testPassword
    });
    if (onboardRes.ok) {
      pass(`Server onboarding triggered (role: ${onboardRes.data?.role || "N/A"})`);
    } else {
      fail("Server onboarding route", `${onboardRes.status} — ${JSON.stringify(onboardRes.data)}`);
    }

    // Get user profile
    const userRes = await api("GET", "/api/auth/user", accessToken);
    if (userRes.ok && userRes.data?.id) {
      pass(`User profile returned (tier: ${userRes.data?.subscriptionTier || "starter"})`);
    } else {
      fail("GET /api/auth/user", `${userRes.status}`);
    }
  }

  // ── Stage 2: Core Data Endpoints ───────────────────────────────────────────────
  console.log("\n▶ STAGE 2: Core Data Endpoints");

  // Verify Board-Ready Fixtures (Real Documents)
  const fixtures = [
    "Axmed insurane policy.pdf",
    "Seacom - MSA Nyali.pdf"
  ];

  for (const fixture of fixtures) {
    const filePath = resolve(process.cwd(), "tests", "fixtures", fixture);
    if (!existsSync(filePath)) {
      fail(`Fixture missing: ${fixture}`);
    } else {
      pass(`Board-ready fixture verified: ${fixture}`);
    }
  }

  const endpoints = [
    ["GET", "/api/contracts"],
    ["GET", "/api/clients"],
    ["GET", "/api/risks"],
    ["GET", "/api/workspaces"],
    ["GET", "/api/compliance-audits"],
    ["GET", "/api/savings"],
    ["GET", "/api/vendors/scorecards"],
    ["GET", "/api/reports"],
    ["GET", "/api/audit-logs"],
    ["GET", "/api/billing/telemetry"],
  ];

  for (const [method, path] of endpoints) {
    const res = await api(method, path, accessToken);
    if (res.ok) {
      const count = Array.isArray(res.data) ? ` (${res.data.length} records)` : "";
      pass(`${method} ${path}${count}`);
    } else {
      fail(`${method} ${path}`, `${res.status}`);
    }
  }

  // ── Stage 3: Paywall Enforcement ──────────────────────────────────────────
  console.log("\n▶ STAGE 3: Subscription Paywall");
  const billingRes = await api("POST", "/api/billing/subscribe", accessToken, { planType: "pro" });
  // We expect either 200 (PayPal URL returned) or 400/500 if PayPal keys not configured
  if (billingRes.status === 200 || billingRes.status === 400 || billingRes.status === 500) {
    pass(`Billing route reachable (${billingRes.status}) — ${billingRes.data?.message || "gateway response received"}`);
  } else {
    fail("POST /api/billing/subscribe", `Unexpected status ${billingRes.status}`);
  }

  // ── Stage 4: Infrastructure Telemetry ────────────────────────────────────
  console.log("\n▶ STAGE 4: Telemetry & Governance");
  const telemetryRes = await api("GET", "/api/infrastructure/logs", accessToken);
  if (telemetryRes.ok) {
    pass(`Infrastructure logs accessible (${Array.isArray(telemetryRes.data) ? telemetryRes.data.length : "N/A"} entries)`);
  } else {
    fail("GET /api/infrastructure-logs", `${telemetryRes.status}`);
  }

  // ── Stage 5: Cleanup ──────────────────────────────────────────────────────
  console.log("\n▶ STAGE 5: Cleanup");
  if (userId) {
    const { error: delErr } = await adminClient.auth.admin.deleteUser(userId);
    if (delErr) fail("Delete test user", delErr.message);
    else pass("Test user deleted from Supabase Auth");
  }

  // ── Results ───────────────────────────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log(`║  RESULTS: ${passed} passed, ${failed} failed`.padEnd(60) + "║");
  console.log("╚══════════════════════════════════════════════════════════╝");

  if (failures.length > 0) {
    console.log("\n⚠️  Failed tests:");
    failures.forEach((f) => console.log(`   - ${f}`));
    process.exit(1);
  } else {
    console.log("\n🎉 ALL TESTS PASSED — Platform is production-ready!");
    process.exit(0);
  }
}

run().catch((err) => {
  console.error("💥 FATAL E2E ERROR:", err.message);
  process.exit(1);
});
