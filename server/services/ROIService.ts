import { Contract, Risk } from "../../shared/schema.js";

/**
 * Enterprise ROI Service
 * Calculates and visualizes the economic impact of Costloci.
 * Designed for CFOs and Boards to justify platform spend and demonstrate value realization.
 */
export class ROIService {
  static HOURLY_RATE = 350; // Standard Legal/Compliance Hourly Rate ($)
  static EFFICIENCY_GAIN = 2.5; // Hours saved per contract analysis
  static RISK_MITIGATION_VALUE = 2500; // Average savings per addressed legal gap

  /**
   * Calculates the total economic impact for an organization based on system intelligence.
   */
  static calculateEconomicImpact(contracts: Contract[] = [], risks: Risk[] = [], tier: string = 'enterprise') {
    const totalContracts = contracts.length;
    const tierMultiplier = tier === 'enterprise' ? 1.5 : tier === 'pro' ? 1.2 : 1.0;
    
    // 1. Efficiency Savings (Time Liberated)
    const hoursSaved = totalContracts * (this.EFFICIENCY_GAIN * tierMultiplier);
    const efficiencySavings = Math.round(hoursSaved * this.HOURLY_RATE);

    // 2. Risk Mitigation Value
    let totalIdentifiedGaps = 0;
    contracts.forEach(c => {
      // Approximate identified gaps based on risk score inversion or ai flags
      const ai = c.intelligenceAnalysis as any;
      if (ai && ai.riskFlags && Array.isArray(ai.riskFlags)) {
        totalIdentifiedGaps += ai.riskFlags.length;
      } else {
        totalIdentifiedGaps += 1;
      }
    });
    const riskMitigationValue = totalIdentifiedGaps * this.RISK_MITIGATION_VALUE;

    // 3. Financial Exposure Mitigated
    let mitigatedExposure = 0;
    risks.forEach(risk => {
      if (risk.mitigationStatus === 'mitigated' || risk.mitigationStatus === 'accepted') {
         // Proxy financial estimate based on severity
         if (risk.severity === 'critical') mitigatedExposure += 55000;
         else if (risk.severity === 'high') mitigatedExposure += 25000;
         else if (risk.severity === 'medium') mitigatedExposure += 5000;
      }
    });

    const totalImpact = efficiencySavings + riskMitigationValue + mitigatedExposure;

    return {
      totalImpact,
      efficiencySavings,
      hoursSaved: Math.round(hoursSaved),
      riskMitigationValue,
      mitigatedExposure,
      roiRatio: totalImpact > 0 ? parseFloat((totalImpact / (this.getPlanPrice(tier) * 12)).toFixed(1)) : 0
    };
  }

  /**
   * Provides sector-specific benchmarks for contract costs.
   */
  static getSectorBenchmarks(sector: string = 'SaaS', jurisdiction: string = 'Global') {
    const benchmarks: Record<string, { avg_annual_cost: number; compliance_target: number }> = {
      'SaaS': { avg_annual_cost: 15000, compliance_target: 85 },
      'FinTech': { avg_annual_cost: 45000, compliance_target: 95 },
      'Healthcare': { avg_annual_cost: 35000, compliance_target: 90 },
      'Telecom': { avg_annual_cost: 25000, compliance_target: 88 },
      'General': { avg_annual_cost: 10000, compliance_target: 75 }
    };

    return benchmarks[sector] || benchmarks['General'];
  }

  static getPlanPrice(tier: string) {
    if (tier === 'enterprise') return 999;
    if (tier === 'pro') return 299;
    if (tier === 'starter') return 99;
    return 99;
  }
}
