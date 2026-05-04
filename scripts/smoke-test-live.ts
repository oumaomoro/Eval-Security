#!/usr/bin/env node
/**
 * Costloci Enterprise - Live Production Smoke Test Suite
 * Validates all critical endpoints on the live Vercel deployment
 */

const BACKEND = "https://api.costloci.com";   // Vercel serverless
const FRONTEND = "https://costloci.com";          // Cloudflare Pages

const COLORS = {
  pass: "\x1b[32m",
  fail: "\x1b[31m",
  warn: "\x1b[33m",
  info: "\x1b[36m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

const log = (color: string, msg: string) =>
  console.log(`${color}${msg}${COLORS.reset}`);

interface TestResult {
  name: string;
  url: string;
  passed: boolean;
  status: number | string;
  latencyMs: number;
  note?: string;
}

const results: TestResult[] = [];

async function probe(
  name: string,
  url: string,
  opts: {
    method?: string;
    body?: object;
    headers?: Record<string, string>;
    expectStatus?: number[];
    expectBodyContains?: string;
    timeoutMs?: number;
  } = {}
): Promise<TestResult> {
  const start = Date.now();
  const timeout = opts.timeoutMs ?? 12000;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const res = await fetch(url, {
      method: opts.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(opts.headers ?? {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timer);
    const latencyMs = Date.now() - start;

    let bodyText = "";
    try { bodyText = await res.text(); } catch { /* ignore */ }

    const expectedStatuses = opts.expectStatus ?? [200, 201];
    const statusOk = expectedStatuses.includes(res.status);
    const bodyOk = opts.expectBodyContains
      ? bodyText.includes(opts.expectBodyContains)
      : true;

    const passed = statusOk && bodyOk;
    const result: TestResult = {
      name,
      url,
      passed,
      status: res.status,
      latencyMs,
      note: !bodyOk ? `Missing "${opts.expectBodyContains}" in body` : undefined,
    };

    const icon = passed ? "✅" : "❌";
    const color = passed ? COLORS.pass : COLORS.fail;
    log(color, `  ${icon} [${res.status}] ${name} (${latencyMs}ms)${result.note ? ` — ${result.note}` : ""}`);

    results.push(result);
    return result;
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    const isTimeout = err.name === "AbortError";
    const result: TestResult = {
      name,
      url,
      passed: false,
      status: isTimeout ? "TIMEOUT" : "NETWORK_ERROR",
      latencyMs,
      note: isTimeout ? `Timed out after ${timeout}ms` : err.message,
    };
    log(COLORS.fail, `  ❌ [${result.status}] ${name} (${latencyMs}ms) — ${result.note}`);
    results.push(result);
    return result;
  }
}

async function runSuite() {
  log(COLORS.bold + COLORS.info, "\n╔══════════════════════════════════════════════════╗");
  log(COLORS.bold + COLORS.info,   "║  Costloci Live Production Smoke Test Suite       ║");
  log(COLORS.bold + COLORS.info,   "╚══════════════════════════════════════════════════╝\n");

  // ── 1. INFRASTRUCTURE ──────────────────────────────────────
  log(COLORS.info, "📡 Infrastructure & Health");
  await probe("API Health Check", `${BACKEND}/api/health`, {
    expectStatus: [200],
    expectBodyContains: "status",
  });
  await probe("Frontend Availability", FRONTEND, {
    expectStatus: [200],
    expectBodyContains: "Costloci",
  });
  await probe("CRON Pulse (Auth Guard)", `${BACKEND}/api/cron/pulse`, {
    method: "POST",
    expectStatus: [401, 403],
  });

  // ── 2. AUTH ENDPOINTS ─────────────────────────────────────
  log(COLORS.info, "\n🔐 Authentication Surface");
  await probe("Register (Schema Validation)", `${BACKEND}/api/auth/register`, {
    method: "POST",
    body: {},
    expectStatus: [400, 422],
  });
  await probe("Login (Schema Validation)", `${BACKEND}/api/auth/login`, {
    method: "POST",
    body: { email: "x", password: "x" },
    expectStatus: [400, 401, 422],
  });
  await probe("Forgot Password Endpoint", `${BACKEND}/api/auth/forgot-password`, {
    method: "POST",
    body: { email: "smoke-test@costloci.com" },
    expectStatus: [200, 400, 429],
  });

  // ── 3. PROTECTED ROUTES (should reject unauthenticated) ───
  log(COLORS.info, "\n🔒 Protected Route Isolation (RBAC)");
  await probe("Contracts (Unauthenticated)", `${BACKEND}/api/contracts`, {
    expectStatus: [401, 403],
  });
  await probe("Upload Contract (Unauthenticated)", `${BACKEND}/api/upload`, {
    method: "POST",
    expectStatus: [401, 403],
  });
  await probe("Compliance Audits (Unauthenticated)", `${BACKEND}/api/compliance-audits`, {
    expectStatus: [401, 403],
  });
  await probe("Risk Register (Unauthenticated)", `${BACKEND}/api/risks`, {
    expectStatus: [401, 403],
  });
  await probe("Billing Subscribe (Unauthenticated)", `${BACKEND}/api/billing/subscribe`, {
    method: "POST",
    body: { planType: "pro" },
    expectStatus: [401, 403],
  });

  // ── 4. WEBHOOK ENDPOINTS ──────────────────────────────────
  log(COLORS.info, "\n🪝 Webhook Endpoints (Signature Validation)");
  await probe("PayPal Webhook (No Sig)", `${BACKEND}/api/billing/paypal-webhook`, {
    method: "POST",
    body: { event_type: "TEST" },
    expectStatus: [200, 400, 403],
  });
  await probe("Paystack Webhook (Invalid Sig)", `${BACKEND}/api/billing/paystack-webhook`, {
    method: "POST",
    body: { event: "charge.success" },
    headers: { "x-paystack-signature": "INVALID_SIG" },
    expectStatus: [400, 401, 403],
  });

  // ── 5. ADMIN ROUTES (must require admin role) ─────────────
  log(COLORS.info, "\n👑 Admin Route Protection");
  await probe("Admin Stats (Unauthenticated)", `${BACKEND}/api/admin/stats`, {
    expectStatus: [401, 403],
  });

  // ── 6. AI & INTELLIGENCE ─────────────────────────────────
  log(COLORS.info, "\n🤖 Intelligence Gateway");
  await probe("AI Analysis (Unauthenticated)", `${BACKEND}/api/intelligence/analyze`, {
    method: "POST",
    expectStatus: [401, 403],
  });

  // ── SUMMARY ───────────────────────────────────────────────
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const avgLatency = Math.round(
    results.filter(r => typeof r.latencyMs === 'number').reduce((a, b) => a + b.latencyMs, 0) / results.length
  );

  console.log("\n" + "═".repeat(52));
  log(COLORS.bold + COLORS.pass,  `  ✅ PASSED:       ${passed}/${results.length} tests`);
  if (failed > 0) {
    log(COLORS.bold + COLORS.fail, `  ❌ FAILED:       ${failed}/${results.length} tests`);
    console.log("\n  Failed Tests:");
    results.filter(r => !r.passed).forEach(r => {
      log(COLORS.fail, `    • ${r.name} → [${r.status}] ${r.note ?? ""}`);
    });
  }
  log(COLORS.info, `  ⚡ Avg Latency:  ${avgLatency}ms`);
  console.log("═".repeat(52));

  const score = Math.round((passed / results.length) * 100);
  if (score === 100) {
    log(COLORS.bold + COLORS.pass, "\n  🏁 PLATFORM HEALTH: PERFECT — All systems operational\n");
  } else if (score >= 80) {
    log(COLORS.bold + COLORS.warn, "\n  ⚠️  PLATFORM HEALTH: DEGRADED — Some endpoints need attention\n");
  } else {
    log(COLORS.bold + COLORS.fail, "\n  🚨 PLATFORM HEALTH: CRITICAL — Production issues detected\n");
  }

  process.exit(failed > 0 ? 1 : 0);
}

runSuite().catch((err) => {
  console.error("Smoke test suite error:", err);
  process.exit(1);
});
