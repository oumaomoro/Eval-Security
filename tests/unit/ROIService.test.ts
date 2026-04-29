import { ROIService } from "../../server/services/ROIService";
import { expect, describe, it } from "@jest/globals";

describe("ROIService", () => {
  it("should calculate economic impact correctly for a single contract", () => {
    const mockContracts: any[] = [
      {
        id: 1,
        intelligenceAnalysis: {
          riskFlags: ["Flag 1", "Flag 2"]
        }
      }
    ];
    
    const impact = ROIService.calculateEconomicImpact(mockContracts, [], [], 'starter');
    
    // Efficiency: 1 contract * 2.5 hours * 350 rate = 875
    expect(impact.efficiencySavings).toBe(875);
    expect(impact.hoursSaved).toBe(3); // Math.round(2.5)
    
    // Risk Mitigation: 2 flags * 2500 = 5000
    expect(impact.riskMitigationValue).toBe(5000);
    
    expect(impact.totalImpact).toBe(5875);
  });

  it("should include mitigated exposure from risks", () => {
    const mockRisks: any[] = [
      {
        id: 1,
        severity: 'critical',
        mitigationStatus: 'mitigated'
      },
      {
        id: 2,
        severity: 'high',
        mitigationStatus: 'accepted'
      }
    ];
    
    const impact = ROIService.calculateEconomicImpact([], mockRisks, [], 'enterprise');
    
    // Mitigated: 55000 (critical) + 25000 (high) = 80000
    expect(impact.mitigatedExposure).toBe(80000);
    expect(impact.totalImpact).toBe(80000);
  });

  it("should calculate ROI ratio based on plan price", () => {
    const mockContracts: any[] = Array(10).fill({ intelligenceAnalysis: {} });
    const impact = ROIService.calculateEconomicImpact(mockContracts, [], [], 'starter');
    
    // Plan price 99 * 12 = 1188
    // Impact: (10 * 2.5 * 350) + (10 * 2500) = 8750 + 25000 = 33750
    // ROI: 33750 / 1188 = 28.4
    expect(impact.roiRatio).toBeCloseTo(28.4, 0);
  });
});
