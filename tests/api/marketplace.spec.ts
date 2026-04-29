import request from "supertest";
import { expect, describe, it, beforeAll } from "@jest/globals";
import { cleanupDatabase } from "../helpers/supabase-test-client";
import { createTestUser, type TestUser } from "../helpers/test-auth";

const API_URL = "http://127.0.0.1:3200";

describe("Marketplace API & Commission Logic", () => {
  let seller: TestUser;
  let buyer: TestUser;
  let assetId: number;

  beforeAll(async () => {
    await cleanupDatabase();
    seller = await createTestUser("seller@costloci.test", "Password123!!", "Seller", "User");
    buyer  = await createTestUser("buyer@costloci.test",  "Password123!!", "Buyer",  "User");
  }, 60000);

  it("should allow a seller to list a clause/asset", async () => {
    const res = await request(API_URL)
      .post("/api/marketplace/listings")
      .set(seller.authHeaders())
      .send({
        title: "KDPA Compliance Clause Pack",
        description: "Complete set of clauses for Kenyan data protection.",
        price: 50.00,
        category: "legal_templates",
        content: "This is the legal content of the clause."
      });

    expect(res.status).toBe(201);
    assetId = res.body.id;
  });

  it("should calculate correct commission on purchase", async () => {
    const res = await request(API_URL)
      .post("/api/marketplace/purchase")
      .set(buyer.authHeaders())
      .send({
        listingId: assetId,
        paymentMethod: "paypal"
      });

    expect(res.status).toBe(200);
    // Commission is 30% (platform) — price 50.00 * 0.3 = 15.00
    expect(res.body.commission.platformFee).toBeCloseTo(15.00, 1);
    expect(res.body.commission.sellerShare).toBeCloseTo(35.00, 1);
  });
});
