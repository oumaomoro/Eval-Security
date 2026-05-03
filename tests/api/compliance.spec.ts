import request from "supertest";
import { expect, describe, it, beforeAll } from "@jest/globals";
import { cleanupDatabase } from "../helpers/supabase-test-client";
import { createTestUser, type TestUser } from "../helpers/test-auth";

const API_URL = "http://127.0.0.1:3200";

describe("Compliance API", () => {
  let user1: TestUser;
  let rulesetId: number;
  let contractId: number;

  beforeAll(async () => {
    await cleanupDatabase();
    await new Promise(resolve => setTimeout(resolve, 2000));
    user1 = await createTestUser(`compliance-tester-${Date.now()}@costloci.test`, "Password123!!", "Comp", "Tester");
    console.log(`[TEST-DIAG] Created User1: ${user1.userId}`);
    
    // Create a contract to run audits against
    const contractRes = await request(API_URL)
      .post("/api/contracts")
      .set(user1.authHeaders())
      .send({
        vendorName: "CyberArmor",
        productService: "Endpoint Protection",
        category: "endpoint_protection",
        annualCost: 25000,
        status: "active"
      });
    
    if (contractRes.status !== 201) {
      console.log(`[TEST-DIAG] Contract Creation Failed: ${contractRes.status} - ${JSON.stringify(contractRes.body)}`);
    }

    contractId = contractRes.body.id;
  }, 180000);

  describe("Rulesets", () => {
    it("should allow creating a custom ruleset", async () => {
      const res = await request(API_URL)
        .post("/api/compliance/rulesets")
        .set(user1.authHeaders())
        .send({
          name: "Test ISO27001 Ruleset",
          standard: "ISO27001",
          description: "Custom rules for ISO27001 validation",
          rules: [
            { id: "ISO-1", requirement: "Access Control", description: "MFA must be enforced", severity: "critical" },
            { id: "ISO-2", requirement: "Logging", description: "Audit logs must be retained for 1 year", severity: "high" }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Test ISO27001 Ruleset");
      rulesetId = res.body.id;
    });

    it("should list compliance rulesets", async () => {
      const res = await request(API_URL)
        .get("/api/compliance/rulesets")
        .set(user1.authHeaders());

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe("Audits", () => {
    it("should allow running a compliance audit", async () => {
      const res = await request(API_URL)
        .post("/api/compliance-audits/run")
        .set(user1.authHeaders())
        .send({
          scope: {
            contractIds: [contractId],
            standards: ["KDPA"],
            categories: ["endpoint_protection"]
          },
          auditType: "automated"
        });

      if (res.status !== 201) {
        console.log(`[TEST-DIAG] POST /api/compliance-audits/run Failed: ${res.status} - ${JSON.stringify(res.body)}`);
      }

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("in_progress");
      expect(res.body.auditName).toContain("Sovereign Audit");
    });

    it("should list compliance audits", async () => {
      const res = await request(API_URL)
        .get("/api/compliance-audits")
        .set(user1.authHeaders());

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });
});
