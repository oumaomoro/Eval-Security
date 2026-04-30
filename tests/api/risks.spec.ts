import request from "supertest";
import { expect, describe, it, beforeAll } from "@jest/globals";
import { cleanupDatabase } from "../helpers/supabase-test-client";
import { createTestUser, type TestUser } from "../helpers/test-auth";

const API_URL = "http://127.0.0.1:3200";

describe("Risks API", () => {
  let user1: TestUser;
  let contractId: number;
  let riskId: number;

  beforeAll(async () => {
    await cleanupDatabase();
    const runId = Date.now();
    user1 = await createTestUser(`risk-tester-${runId}@costloci.test`, "Password123!!", "Risk", "Tester");
    
    // Propagation delay for Supabase background provisioning
    await new Promise(r => setTimeout(r, 2000));

    // Create a contract to associate risks with
    const contractRes = await request(API_URL)
      .post("/api/contracts")
      .set(user1.authHeaders())
      .send({
        vendorName: "SafeCloud",
        productService: "Cloud Storage",
        category: "cloud_security",
        annualCost: 12000,
        status: "active"
      });
    contractId = contractRes.body.id;
  }, 60000);

  it("should allow creating a new risk", async () => {
    const res = await request(API_URL)
      .post("/api/risks")
      .set(user1.authHeaders())
      .send({
        contractId: contractId,
        riskTitle: "Data Residency Risk",
        riskCategory: "compliance",
        riskDescription: "Data stored in unauthorized region (KDPA §25 violation)",
        severity: "critical",
        likelihood: "possible",
        impact: "major",
        riskScore: 75
      });

    expect(res.status).toBe(201);
    expect(res.body.riskTitle).toBe("Data Residency Risk");
    riskId = res.body.id;
  });

  it("should list risks for the workspace", async () => {
    const res = await request(API_URL)
      .get("/api/risks")
      .set(user1.authHeaders());

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("should allow mitigating a risk", async () => {
    const res = await request(API_URL)
      .patch(`/api/risks/${riskId}/mitigate`)
      .set(user1.authHeaders())
      .send({
        status: "mitigated",
        strategy: "Migrated data to Kenya-based AWS region as per KDPA requirements."
      });

    expect(res.status).toBe(200);
    expect(res.body.mitigationStatus).toBe("mitigated");
  });

  it("should filter risks by contract ID", async () => {
    const res = await request(API_URL)
      .get(`/api/risks?contractId=${contractId}`)
      .set(user1.authHeaders());

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.every((r: any) => r.contractId === contractId)).toBe(true);
  });
});
