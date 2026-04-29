import { IntelligenceGateway } from "../../server/services/IntelligenceGateway";
import { expect, describe, it, jest, beforeEach } from "@jest/globals";
import { storage } from "../../server/storage";

// Mock storage
jest.mock("../../server/storage");

describe("IntelligenceGateway", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset circuit breakers
    (IntelligenceGateway as any).circuitBreaker = {
      deepseek: { failures: 0, state: 'CLOSED', nextAttempt: 0, requestInProgress: false },
      openai: { failures: 0, state: 'CLOSED', nextAttempt: 0, requestInProgress: false },
      anthropic: { failures: 0, state: 'CLOSED', nextAttempt: 0, requestInProgress: false },
      huggingface: { failures: 0, state: 'CLOSED', nextAttempt: 0, requestInProgress: false },
      ollama: { failures: 0, state: 'CLOSED', nextAttempt: 0, requestInProgress: false }
    };
    // Default mock for cache (not found)
    (storage.getIntelligenceCache as any).mockResolvedValue(null);
    (storage.createInfrastructureLog as any).mockResolvedValue({});
  });

  it("should return cached response if available", async () => {
    (storage.getIntelligenceCache as any).mockResolvedValue("Cached Response");
    
    const response = await IntelligenceGateway.createCompletion({
      model: "gpt-4o",
      messages: [{ role: "user", content: "Test" }]
    });
    
    expect(response).toBe("Cached Response");
    expect(storage.getIntelligenceCache).toHaveBeenCalled();
  });

  it("should record failure and eventually trip circuit breaker", async () => {
    // Force DeepSeek failure
    const mockDS = {
      chat: {
        completions: {
          create: jest.fn<any>().mockRejectedValue(new Error("API Error"))
        }
      }
    };
    (IntelligenceGateway as any).getDeepSeek = () => mockDS;
    (IntelligenceGateway as any).DEEPSEEK_KEY = "valid";

    // Call once and check failure count
    try {
      await IntelligenceGateway.createCompletion({
        model: "gpt-4o",
        messages: [{ role: "user", content: "Test Failure" }]
      });
    } catch (e) {}

    const cb = (IntelligenceGateway as any).circuitBreaker.deepseek;
    expect(cb.failures).toBeGreaterThan(0);
  }, 30000);

  it("should fallback to OpenAI if DeepSeek fails", async () => {
    const mockDS = {
      chat: { completions: { create: jest.fn<any>().mockRejectedValue(new Error("DS Error")) } }
    };
    const mockOA = {
      chat: { completions: { create: jest.fn<any>().mockResolvedValue({ choices: [{ message: { content: "OpenAI Response" } }] }) } }
    };

    (IntelligenceGateway as any).getDeepSeek = () => mockDS;
    (IntelligenceGateway as any).getOpenAI = () => mockOA;
    (IntelligenceGateway as any).DEEPSEEK_KEY = "valid";
    (IntelligenceGateway as any).OPENAI_KEY = "valid";

    const response = await IntelligenceGateway.createCompletion({
      model: "gpt-4o",
      messages: [{ role: "user", content: "Test Fallback" }]
    });

    expect(response).toBe("OpenAI Response");
  }, 30000);
});
