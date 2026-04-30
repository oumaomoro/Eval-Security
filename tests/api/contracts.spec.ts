import request from "supertest";
import { expect, describe, it, beforeAll } from "@jest/globals";
import { cleanupDatabase } from "../helpers/supabase-test-client";
import { createTestUser, type TestUser } from "../helpers/test-auth";

const API_URL = "http://127.0.0.1:3200";

describe("Contracts API & Isolation", () => {
  let user1: TestUser;
  let user2: TestUser;
  let contractId: number;

  beforeAll(async () => {
    await cleanupDatabase();
    // Unique emails per run to avoid identity collision
    const runId = Date.now();
    user1 = await createTestUser(`user1-${runId}@costloci.test`, "Password123!!", "User", "One");
    user2 = await createTestUser(`user2-${runId}@costloci.test`, "Password123!!", "User", "Two");
    
    // Propagation delay for Supabase background provisioning (ClientId/WorkspaceId)
    await new Promise(r => setTimeout(r, 2000));
  }, 60000);

  it("should allow User 1 to create a contract", async () => {
    const res = await request(API_URL)
      .post("/api/contracts")
      .set(user1.authHeaders())
      .send({
        vendorName: "Cisco",
        productService: "Firewall",
        category: "network_security",
        annualCost: 50000,
        status: "active"
      });

    expect(res.status).toBe(201);
    contractId = res.body.id;
  });

  it("should allow User 1 to fetch their own contract", async () => {
    const res = await request(API_URL)
      .get(`/api/contracts/${contractId}`)
      .set(user1.authHeaders());

    expect(res.status).toBe(200);
    expect(res.body.vendorName).toBe("Cisco");
  });

  it("should DENY User 2 access to User 1's contract (Multi-tenant Isolation)", async () => {
    const res = await request(API_URL)
      .get(`/api/contracts/${contractId}`)
      .set(user2.authHeaders());

    // Should be 403 or 404 depending on isolation implementation
    expect([403, 404]).toContain(res.status);
  });

  it("should list contracts only for the current workspace", async () => {
    const res1 = await request(API_URL)
      .get("/api/contracts")
      .set(user1.authHeaders());

    const res2 = await request(API_URL)
      .get("/api/contracts")
      .set(user2.authHeaders());

    // User 1 has 1 contract, User 2 has 0
    const user1Contracts = Array.isArray(res1.body) ? res1.body : (res1.body?.contracts ?? []);
    const user2Contracts = Array.isArray(res2.body) ? res2.body : (res2.body?.contracts ?? []);
    expect(user1Contracts.length).toBe(1);
    expect(user2Contracts.length).toBe(0);
  });
});
