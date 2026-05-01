import { storage } from "../storage.js";
import { IntelligenceGateway } from "./IntelligenceGateway.js";
import type { Contract, Risk } from "../../shared/schema.js";

/**
 * RISK ENGINE - Enterprise Intelligence
 * 
 * Conducts deep structural risk analysis of cybersecurity contracts across 6 categories:
 * 1. Compliance (regulatory violations)
 * 2. Financial (cost overruns, penalties)
 * 3. Operational (SLA failures, vendor dependency)
 * 4. Security (data breaches, vulnerabilities)
 * 5. Strategic (vendor lock-in)
 * 6. Reputational (brand damage)
 */
export class RiskEngine {
  /**
   * Automates risk identification for a specific contract.
   * Uses Intelligence to parse the contract document and identify risks.
   */
  static async identifyRisks(contractId: number): Promise<Risk[]> {
    const contract = await storage.getContract(contractId);
    if (!contract) throw new Error("Contract not found for risk analysis");

    const prompt = `
      You are an expert Cybersecurity Risk Auditor. Conduct a comprehensive risk analysis for the following contract.
      
      CONTRACT DETAILS:
      Vendor: ${contract.vendorName}
      Service: ${contract.productService}
      Category: ${contract.category}
      Annual Cost: $${contract.annualCost}
      
      Identify ALL risks across these 6 categories:
      1. Compliance: Regulatory violations (KDPA, CBK, GDPR, etc.)
      2. Financial: Hidden costs, unfavorable penalties, over-market pricing
      3. Operational: Poor SLA guarantees, lack of business continuity, vendor lock-in
      4. Security: Weak data protection, incident response gaps, sub-processor risks
      5. Strategic: Competitive disadvantage, alignment with corporate strategy
      6. Reputational: Impact on brand trust if vendor fails
      
      For each risk, provide:
      - Title
      - Category
      - Description
      - Severity (low, medium, high, critical)
      - Likelihood (rare, unlikely, possible, likely, almost_certain)
      - Impact (minimal, minor, moderate, major, very_high)
      - Risk Score (1-25)
      - Mitigation Status (identified)
      - Mitigation Strategies (array of strings)
      - Financial Exposure (Min and Max estimate in USD)
      - Intelligence Confidence (1-100)
      
      Respond strictly in JSON format:
      {
        "risks": [
          {
            "riskTitle": "string",
            "riskCategory": "compliance | financial | operational | security | strategic | reputational",
            "riskDescription": "string",
            "severity": "low | medium | high | critical",
            "likelihood": "rare | unlikely | possible | likely | almost_certain",
            "impact": "minimal | minor | moderate | major | very_high",
            "riskScore": number,
            "mitigationStatus": "identified",
            "mitigationStrategies": ["string"],
            "financialExposureMin": number,
            "financialExposureMax": number,
            "intelligenceConfidence": number
          }
        ]
      }
    `;

    try {
      const response = await IntelligenceGateway.createCompletion({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response);
      const identifiedRisks: Risk[] = [];

      if (result.risks && Array.isArray(result.risks)) {
        for (const riskData of result.risks) {
          const risk = await storage.createRisk({
            workspaceId: contract.workspaceId || 1,
            contractId: contract.id,
            riskTitle: riskData.riskTitle,
            riskCategory: riskData.riskCategory,
            riskDescription: riskData.riskDescription,
            severity: riskData.severity,
            likelihood: riskData.likelihood,
            impact: riskData.impact,
            riskScore: riskData.riskScore,
            mitigationStatus: riskData.mitigationStatus || "identified",
            mitigationStrategies: riskData.mitigationStrategies || [],
            financialExposureMin: riskData.financialExposureMin,
            financialExposureMax: riskData.financialExposureMax,
            intelligenceConfidence: riskData.intelligenceConfidence
          });
          identifiedRisks.push(risk);
        }
      }

      return identifiedRisks;

    } catch (err: any) {
      await storage.createInfrastructureLog({
        component: "RiskEngine",
        event: "RISK_ANALYSIS_ERROR",
        status: "analyzing",
        actionTaken: `Deep analysis failed for contract ${contractId}: ${err.message}`
      });
      return [];
    }
  }

  /**
   * Portfolio-wide risk assessment trigger
   */
  static async auditPortfolio(clientId: number): Promise<void> {
    const contracts = await storage.getContracts({ clientId });
    for (const contract of contracts) {
      // Avoid duplicate risks by checking if risks already exist for this contract
      const existingRisks = await storage.getRisks(contract.id);
      if (existingRisks.length === 0) {
        await this.identifyRisks(contract.id);
      }
    }
  }
}
