import { storage } from "../storage.js";
import { SOC2Logger } from "./SOC2Logger.js";

export class ScorecardEngine {
  /**
   * Generates or updates a vendor scorecard based on latest contract data,
   * compliance audits, and risk assessments.
   */
  static async updateScorecard(vendorName: string, workspaceId: number): Promise<any> {
    console.log(`[SCORECARD] Recalculating score for vendor: ${vendorName}`);

    // 1. Fetch relevant data
    const contracts = await storage.getContracts();
    const vendorContracts = contracts.filter(c => c.vendorName === vendorName);
    
    if (vendorContracts.length === 0) {
      console.warn(`[SCORECARD] No contracts found for vendor ${vendorName}`);
      return null;
    }

    const contractIds = vendorContracts.map(c => c.id);
    const audits = await storage.getComplianceAudits();
    const vendorAudits = audits.filter(a => a.scope?.contractIds?.some((id: number) => contractIds.includes(id)));
    
    const risks = await storage.getRisks();
    const vendorRisks = risks.filter(r => contractIds.includes(r.contractId));

    // 2. Calculate Dimensions
    
    // Compliance Score: Average of audit scores
    const complianceScore = vendorAudits.length > 0
      ? vendorAudits.reduce((sum, a) => sum + (a.overallComplianceScore || 0), 0) / vendorAudits.length
      : 70; // Default to neutral if no audits yet

    // Risk Score: Inverse of risk severity/count
    // Critical risk = 40 pts, High = 20 pts, Med = 10 pts, Low = 5 pts
    // Max deductions = 100
    const riskDeductions = vendorRisks.reduce((sum, r) => {
      if (r.severity === 'critical') return sum + 40;
      if (r.severity === 'high') return sum + 20;
      if (r.severity === 'medium') return sum + 10;
      return sum + 5;
    }, 0);
    const riskScore = Math.max(0, 100 - riskDeductions);

    // Security Score: Based on AI analysis flags (simplified)
    const securityScore = 85; // Placeholder for deep AI flag analysis

    // SLA Performance: (simplified)
    const slaPerformance = 95; 

    // 5. Pricing Competitiveness
    // Deduct points if savings opportunities exist (meaning current pricing is high)
    const pricingOptimization = await storage.getSavingsOpportunities().then(ops => 
      ops.filter(o => contractIds.includes(o.contractId) && o.type === 'market_pricing_optimization')
    );
    
    let pricingScore = 100;
    if (pricingOptimization.length > 0) {
      const totalPotential = pricingOptimization.reduce((sum, o) => sum + (o.estimatedSavings || 0), 0);
      const totalAnnualCost = vendorContracts.reduce((sum, c) => sum + (c.annualCost || 0), 0);
      const savingsRatio = totalAnnualCost > 0 ? (totalPotential / totalAnnualCost) : 0;
      
      // If savings potential is 20% of cost, deduct 40 points
      pricingScore = Math.max(0, 100 - (savingsRatio * 200));
    }

    // 3. Overall Grade
    const overall = (complianceScore + riskScore + securityScore + slaPerformance + pricingScore) / 5;
    let grade = 'C';
    if (overall >= 90) grade = 'A';
    else if (overall >= 80) grade = 'B';
    else if (overall >= 70) grade = 'C';
    else if (overall >= 60) grade = 'D';
    else grade = 'F';

    // 4. Persist
    const scorecard = await storage.createVendorScorecard({
      workspaceId,
      vendorName,
      contractId: vendorContracts[0].id, // Reference primary contract
      complianceScore: Math.round(complianceScore),
      riskScore: Math.round(riskScore),
      securityScore: Math.round(securityScore),
      slaPerformance: Math.round(slaPerformance),
      overallGrade: grade,
      lastAssessmentDate: new Date()
    });

    return scorecard;
  }
}
