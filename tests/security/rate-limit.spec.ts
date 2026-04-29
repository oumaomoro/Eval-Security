import request from "supertest";
import { expect, describe, it } from "@jest/globals";

const API_URL = "http://localhost:3200";

describe("Security: Rate Limiting", () => {
  it("should trigger 429 Too Many Requests after rapid login attempts", async () => {
    const attempts = 20;
    const promises = [];
    
    for (let i = 0; i < attempts; i++) {
      promises.push(
        request(API_URL)
          .post("/api/login")
          .send({ email: "attacker@malicious.com", password: "wrong" })
      );
    }
    
    const responses = await Promise.all(promises);
    const ratelimited = responses.some(res => res.status === 429);
    
    expect(ratelimited).toBe(true);
  });
});
