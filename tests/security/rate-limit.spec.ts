import request from "supertest";
import { expect, describe, it } from "@jest/globals";

const API_URL = "http://127.0.0.1:3200";

describe("Security: Rate Limiting", () => {
  it("should trigger 429 Too Many Requests after rapid login attempts", async () => {
    const attempts = 20;
    const promises = [];
    
    for (let i = 0; i < attempts; i++) {
      promises.push(
        request(API_URL)
          .post("/api/auth/login")
          .set("x-test-enable-rate-limit", "true")
          .send({ email: "attacker@malicious.com", password: "wrong" })
      );
    }
    
    const responses = await Promise.all(promises);
    const ratelimited = responses.some(res => res.status === 429);
    
    expect(ratelimited).toBe(true);
  });
});
