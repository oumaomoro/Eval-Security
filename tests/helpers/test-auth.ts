/**
 * TEST AUTH HELPER
 *
 * Provides a createTestUser() helper that:
 *   1. Registers the user via the API (provisions them in Supabase + local DB)
 *   2. Returns their local user ID directly from the registration response
 *   3. Subsequent requests use x-test-user-id header to bypass JWT validation
 *
 * This pattern decouples integration tests from live Supabase JWT issuance
 * and email confirmation requirements, making the suite reliable in CI.
 */

import request from "supertest";

const API_URL = "http://127.0.0.1:3200";

export interface TestUser {
  userId: string;
  email: string;
  /** Returns headers that inject test auth identity without JWT */
  authHeaders: () => { "x-test-user-id": string };
}

/**
 * Creates a test user by calling /api/auth/register and extracts the userId
 * directly from the registration response body (always present, no email
 * confirmation required).
 */
export async function createTestUser(
  email: string,
  password = "Password123!!",
  firstName = "Test",
  lastName = "User"
): Promise<TestUser> {
  const regRes = await request(API_URL)
    .post("/api/auth/register")
    .send({ email, password, firstName, lastName });

  // Registration returns { message, userId } — userId is the Supabase UUID
  // which is also the primary key in the local users table.
  let userId: string = regRes.body?.userId ?? "";

  if (!userId && regRes.status === 400 && regRes.body?.message?.includes("already been registered")) {
    // Attempt to recover by fetching existing user ID from Supabase directly
    const res = await request(API_URL)
      .get(`/api/auth/debug/user-id?email=${encodeURIComponent(email)}`);
    const profile = res.body;
    
    if (profile?.userId) {
      userId = profile.userId;
      console.log(`[test-auth] Recovered userId for ${email}: ${userId}`);
    }
  }

  if (!userId) {
    console.warn(
      `[test-auth] createTestUser: registration did not return a userId for ${email}. ` +
      `Status: ${regRes.status}, body: ${JSON.stringify(regRes.body)}`
    );
  }

  return {
    userId,
    email,
    authHeaders: () => ({ "x-test-user-id": userId }),
  };
}
