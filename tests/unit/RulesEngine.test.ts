import { RulesEngine } from "../../server/services/RulesEngine";
import { expect, describe, it, jest } from "@jest/globals";

describe("RulesEngine", () => {
  describe("flattenObject", () => {
    it("should flatten nested objects into dot notation", () => {
      const nested = {
        compliance: {
          score: 85,
          details: {
            standard: "KDPA"
          }
        },
        vendor: "Test Vendor"
      };
      
      const flat = (RulesEngine as any).flattenObject(nested);
      
      expect(flat["compliance.score"]).toBe(85);
      expect(flat["compliance.details.standard"]).toBe("KDPA");
      expect(flat["vendor"]).toBe("Test Vendor");
    });
  });

  describe("evaluateCondition", () => {
    const context = {
      "compliance.score": 85,
      "vendor": "Cisco",
      "tags": ["security", "network"],
      "cost": 15000
    };

    it("should handle 'equals' operator", () => {
      const cond = { field: "vendor", operator: "equals", value: "Cisco" };
      expect((RulesEngine as any).evaluateCondition(cond, context)).toBe(true);
      
      const condFalse = { field: "vendor", operator: "equals", value: "Juniper" };
      expect((RulesEngine as any).evaluateCondition(condFalse, context)).toBe(false);
    });

    it("should handle 'greaterThan' and 'lessThan' operators", () => {
      expect((RulesEngine as any).evaluateCondition({ field: "compliance.score", operator: "greaterThan", value: 80 }, context)).toBe(true);
      expect((RulesEngine as any).evaluateCondition({ field: "cost", operator: "lessThan", value: 20000 }, context)).toBe(true);
    });

    it("should handle 'contains' operator for arrays and strings", () => {
      expect((RulesEngine as any).evaluateCondition({ field: "tags", operator: "contains", value: "security" }, context)).toBe(true);
      expect((RulesEngine as any).evaluateCondition({ field: "vendor", operator: "contains", value: "Cis" }, context)).toBe(true);
    });

    it("should handle 'exists' operator", () => {
      expect((RulesEngine as any).evaluateCondition({ field: "vendor", operator: "exists" }, context)).toBe(true);
      expect((RulesEngine as any).evaluateCondition({ field: "missing", operator: "exists" }, context)).toBe(false);
    });
  });
});
