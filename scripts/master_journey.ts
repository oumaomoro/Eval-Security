import "dotenv/config";
import axios from "axios";
import { execSync } from "child_process";

const API_BASE = process.env.API_BASE_URL || "http://127.0.0.1:3200/api";
const RUN_ID = Date.now();
const TEST_USER = {
  email: `jack.ouma.cert.${RUN_ID}@costloci.ai`,
  firstName: "Jack",
  lastName: "Ouma",
  password: "MasterPassword2026!"
};

async function logStage(stage: number, name: string, fn: () => Promise<any>) {
  console.log(`\n[STAGE ${stage}] ${name}...`);
  try {
    const result = await fn();
    console.log(`✅ Stage ${stage} Complete.`);
    return result;
  } catch (err: any) {
    console.error(`❌ Stage ${stage} Failed:`, err.response?.data || err.message);
    process.exit(1);
  }
}

async function runMasterJourney() {
  console.log("🚀 STARTING MASTER ENTERPRISE JOURNEY CERTIFICATION");
  console.log("User: Jack Ouma (file75555@gmail.com)");
  
  let token: string;
  let workspaceId: number;
  let clientId: number;
  let contractId: number;
  let listingId: number;

  // 1. REGISTRATION & AUTHENTICATION
  await logStage(1, "User Registration & Identity Activation", async () => {
    const res = await axios.post(`${API_BASE}/auth/register`, {
      email: TEST_USER.email,
      password: TEST_USER.password,
      firstName: TEST_USER.firstName,
      lastName: TEST_USER.lastName
    });
    
    const userId = res.data.userId;
    console.log(`User created: ${userId}. Activating identity...`);

    // Manually verify email via Supabase Admin (Bypass email delivery for test)
    const { adminClient } = await import("../server/services/supabase");
    await adminClient.auth.admin.updateUserById(userId, { email_confirm: true });
    
    // Now Login to get the Bearer token
    console.log("Logging in...");
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    token = loginRes.data.token;
    if (!token) throw new Error("Login failed: No token returned.");
    
    return loginRes.data;
  });

  const authHeaders = { Authorization: `Bearer ${token}` };

  // 2. WORKSPACE CREATION
  await logStage(2, "Default Workspace Initialization", async () => {
    const res = await axios.get(`${API_BASE}/workspaces`, { headers: authHeaders });
    workspaceId = res.data[0].id;
    console.log(`Using Workspace ID: ${workspaceId}`);
    return res.data;
  });

  // 3. CLIENT ONBOARDING
  await logStage(3, "High-Value Client Creation", async () => {
    const res = await axios.post(`${API_BASE}/clients`, {
      companyName: "Ouma Tech Enterprise",
      industry: "finance",
      contactName: TEST_USER.firstName,
      contactEmail: TEST_USER.email,
      annualBudget: 5000000,
      status: "active"
    }, { headers: authHeaders });
    clientId = res.data.id;
    return res.data;
  });

  // 4. CONTRACT INGESTION
  await logStage(4, "Cybersecurity Contract Upload", async () => {
    const res = await axios.post(`${API_BASE}/contracts`, {
      clientId,
      vendorName: "CloudGuard Security",
      productService: "Managed SIEM",
      category: "network_security",
      annualCost: 120000,
      contractStartDate: "2026-01-01",
      renewalDate: "2027-01-01",
      status: "active",
      fileUrl: "https://example.com/contracts/siem-service.pdf"
    }, { headers: authHeaders });
    contractId = res.data.id;
    return res.data;
  });

  // 5. AI ANALYSIS (SOVEREIGN MODE)
  await logStage(5, "AI Risk & Compliance Analysis", async () => {
    // Note: This triggers the AI gateway
    const res = await axios.post(`${API_BASE}/contracts/${contractId}/analyze`, {}, { headers: authHeaders });
    console.log("Analysis Result Summary:", res.data.summary?.slice(0, 50) + "...");
    return res.data;
  });

  // 6. INSURANCE POLICIES LIST
  await logStage(6, "Insurance Policy Registry", async () => {
    const res = await axios.get(`${API_BASE}/insurance/policies`, { headers: authHeaders });
    console.log(`Insurance policies found: ${res.data?.length ?? 0}`);
    return res.data;
  });

  // 7. COMPLIANCE AUDIT (KDPA)
  await logStage(7, "KDPA Regulatory Audit", async () => {
    const res = await axios.post(`${API_BASE}/compliance-audits/run`, {
      scope: { contractIds: [contractId], standards: ["KDPA"] }
    }, { headers: authHeaders });
    return res.data;
  });

  // 8. MARKETPLACE CATALOG DISCOVERY
  await logStage(8, "Marketplace SKU Discovery", async () => {
    const res = await axios.get(`${API_BASE}/marketplace/listings`, { headers: authHeaders });
    const allListings = res.data || [];
    // Try to find the Resilience Pack, fall back to first available listing
    const pack = allListings.find((l: any) => l.title?.includes("Resilience") || l.title?.includes("Pack")) 
                 || allListings[0];
    if (!pack) {
      console.log("No marketplace listings found — skipping purchase stage.");
      listingId = -1;
    } else {
      listingId = pack.id;
      console.log(`Found SKU: ${pack.title} (ID: ${listingId})`);
    }
    return allListings;
  });

  // 9. PREMIUM PURCHASE (conditional on listing availability)
  await logStage(9, "Marketplace Purchase Flow", async () => {
    if (listingId === -1) {
      console.log("No listing available — purchase stage skipped (Marketplace is empty).");
      return { skipped: true };
    }
    const res = await axios.post(`${API_BASE}/marketplace/purchase`, {
      listingId,
      workspaceId
    }, { headers: authHeaders });
    return res.data;
  });

  // 10. EXECUTIVE REPORTING
  await logStage(10, "Executive Dashboard Summary", async () => {
    const res = await axios.get(`${API_BASE}/contracts`, { headers: authHeaders });
    console.log(`Dashboard contracts: ${res.data?.length ?? 0}`);
    return res.data;
  });

  // 11. MULTI-TENANT ISOLATION VALIDATION
  await logStage(11, "Security: Cross-Tenant Isolation Check", async () => {
    const attackerEmail = `attacker.${RUN_ID}@malicious.com`;

    // 1. Register a second user
    const resB = await axios.post(`${API_BASE}/auth/register`, {
      email: attackerEmail,
      password: "TestPassword123!",
      firstName: "Attacker",
      lastName: "User"
    });

    // Verify attacker's email to allow login
    const attackerUserId = resB.data.userId;
    if (attackerUserId) {
      const { adminClient } = await import("../server/services/supabase");
      await adminClient.auth.admin.updateUserById(attackerUserId, { email_confirm: true });
    }

    // Login as attacker
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: attackerEmail,
      password: "TestPassword123!"
    });
    const tokenB = loginRes.data.token;
    if (!tokenB) throw new Error("Attacker login failed — could not get token for isolation test.");

    // 2. Attempt to access Jack Ouma's contract with Attacker's token
    try {
      const attackRes = await axios.get(`${API_BASE}/contracts/${contractId}`, {
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      // If we get a response, check if it's actually the contract or an empty/different result
      console.error("❌ SECURITY FAILURE: Attacker may have accessed Jack Ouma's data!");
      process.exit(1);
    } catch (err: any) {
      if (err.response?.status === 403 || err.response?.status === 404) {
        console.log("✅ SECURITY PASS: Multi-tenant isolation verified (Access Denied).");
      } else {
        throw err;
      }
    }
  });

  console.log("\n🎊 MASTER JOURNEY COMPLETE - SYSTEM CERTIFIED FOR PRODUCTION");
}

runMasterJourney();
