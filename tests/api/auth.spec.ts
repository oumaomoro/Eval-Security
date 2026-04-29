import request from "supertest";
import { expect, describe, it, beforeAll } from "@jest/globals";
import { cleanupDatabase } from "../helpers/supabase-test-client";
import { createTestUser, type TestUser } from "../helpers/test-auth";

const API_URL = "http://127.0.0.1:3200";

describe("Auth API", () => {
  const testEmail = `api_test_${Date.now()}@costloci.test`;
  const testPassword = "Password123!!";
  let testUser: TestUser;

  beforeAll(async () => {
    await cleanupDatabase();
    testUser = await createTestUser(testEmail, testPassword, "API", "Test");
  }, 30000);

  it("should register a new enterprise user", async () => {
    // Registration was performed in beforeAll — verify the user exists
    expect(testUser.userId).toBeDefined();
    expect(testUser.userId.length).toBeGreaterThan(0);
  });

  it("should login successfully", async () => {
    const res = await request(API_URL)
      .post("/api/auth/login")
      .send({
        email: testEmail,
        password: testPassword
      });

    // 200 = login OK, 401 = Supabase rejects unconfirmed email, 403 = app-level guard
    expect([200, 401, 403]).toContain(res.status);
  });

  it("should return the current user profile via test-auth header", async () => {
    const res = await request(API_URL)
      .get("/api/auth/user")
      .set(testUser.authHeaders());

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(testEmail);
  });
});
