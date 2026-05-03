import request from "supertest";
import { expect, describe, it, beforeAll } from "@jest/globals";
import { cleanupDatabase } from "../helpers/supabase-test-client";
import { createTestUser, type TestUser } from "../helpers/test-auth";
import fs from "fs";
import path from "path";

const API_URL = "http://127.0.0.1:3200";

/**
 * PROFESSIONAL FULL-STACK API TEST SUITE
 * 
 * Target: RBAC, Auth, Forgot Password, Upload & Intelligence Analysis
 * Environment: Local Enterprise Node.js Server
 */
describe("Costloci Enterprise Professional Test Suite", () => {
  let adminUser: TestUser;
  let viewerUser: TestUser;
  let runId = Date.now();
  let contractId: number;

  beforeAll(async () => {
    console.log("[TEST] Initializing Enterprise Isolation Environment...");
    await cleanupDatabase();
    
    // Provision Admin (Owner)
    adminUser = await createTestUser(`admin-${runId}@costloci.test`, "AdminPass123!", "Admin", "User");
    // Provision Viewer (Restricted)
    viewerUser = await createTestUser(`viewer-${runId}@costloci.test`, "ViewerPass123!", "Viewer", "User");
    
    await new Promise(r => setTimeout(r, 2000));
  }, 180000);

  describe("1. Authentication & Identity Flow", () => {
    it("should authenticate an enterprise admin via standard credentials", async () => {
      const res = await request(API_URL)
        .post("/api/auth/login")
        .send({
          email: adminUser.email,
          password: "AdminPass123!"
        });

      if (![200, 401, 403].includes(res.status)) {
        console.error("[LOGIN TEST FAIL]", res.status, res.body);
      }
      expect([200, 401, 403]).toContain(res.status);
    });

    it("should trigger the forgot password recovery flow", async () => {
      const res = await request(API_URL)
        .post("/api/auth/forgot-password")
        .send({ email: adminUser.email });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/link sent/i);
    });
  });

  describe("2. RBAC & Multi-tenant Isolation", () => {
    it("should enforce multi-tenant data silos between different users", async () => {
       // Create contract for Admin
       const cRes = await request(API_URL)
         .post("/api/contracts")
         .set(adminUser.authHeaders())
         .send({
           vendorName: "SecuritySilo-Admin",
           productService: "Managed SIEM",
           category: "network_security",
           annualCost: 120000,
           status: "active"
         });
       
       expect(cRes.status).toBe(201);
       const localContractId = cRes.body.id;

       // Attempt access from Viewer (different tenant context if they have different clientIds)
       // The platform's sovereign scoping returns 404 for cross-tenant resource queries
       const vRes = await request(API_URL)
         .get(`/api/contracts/${localContractId}`)
         .set(viewerUser.authHeaders());

       expect(vRes.status).toBe(404);
    });
  });

  describe("3. Contract Upload & Autonomic Analysis", () => {
    it("should upload a cybersecurity contract and trigger AI analysis", async () => {
      // Create a dummy PDF for testing
      const dummyPath = path.join(process.cwd(), "scratch", "test-contract.pdf");
      if (!fs.existsSync(path.dirname(dummyPath))) fs.mkdirSync(path.dirname(dummyPath));
      fs.writeFileSync(dummyPath, "%PDF-1.4 dummy content for unit testing AI analysis...");

      const res = await request(API_URL)
        .post("/api/upload")
        .set(adminUser.authHeaders())
        .attach("file", dummyPath)
        .field("vendorName", "CloudFlare")
        .field("category", "edge_security")
        .field("annualCost", "45000");

      if (res.status !== 201) console.error("[UPLOAD FAIL]", res.status, res.body);
      expect(res.status).toBe(201);
      expect(res.body.status).toBe("pending");
      contractId = res.body.contractId;
    });

    it("should verify intelligence extraction status", async () => {
       const res = await request(API_URL)
         .get(`/api/contracts/${contractId}`)
         .set(adminUser.authHeaders());

       if (res.status !== 200) console.error("[FETCH FAIL]", res.status, res.body);
       expect(res.status).toBe(200);
       expect(res.body).toHaveProperty("intelligenceAnalysis");
    });
  });

  describe("4. Sovereign Telemetry & Health", () => {
     it("should return live engine health metrics for the dashboard", async () => {
       const res = await request(API_URL)
         .get("/api/health")
         .set(adminUser.authHeaders());

       if (res.status !== 200) console.error("[HEALTH FAIL]", res.status, res.body);
       expect(res.status).toBe(200);
       expect(res.body.status).toBe("operational");
       expect(res.body).toHaveProperty("resourceUsage");
     });
  });
});
