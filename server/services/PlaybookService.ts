import { IntelligenceGateway } from "./IntelligenceGateway.js";
import { storage } from "../storage.js";
import { ROIService } from "./ROIService.js";
import { type Contract, type Risk, type Clause } from "../../shared/schema.js";

export class PlaybookService {
  /**
   * Generates a context-aware negotiation playbook using RAG (Contract Data + Risks + Market Benchmarks).
   */
  static async generateNegotiationPlaybook(contractId: number): Promise<any> {
    try {
      console.log(`[PLAYBOOK] Generating strategic negotiation playbook for Contract #${contractId}...`);

      const contract = await storage.getContract(contractId);
      if (!contract) throw new Error("Contract not found");

      // Fetch supporting data for context injection
      const risks = await storage.getRisks(contractId);
      const contractClauses = await storage.getContractClauses(contractId);
      
      // Fetch market benchmarks
      const benchmarks = ROIService.getSectorBenchmarks(contract.category, 'Global');

      // Identify specific leverage points
      const costDelta = contract.annualCost 
        ? ((contract.annualCost / benchmarks.avg_annual_cost) - 1) * 100 
        : 0;

      const criticalRisks = risks.filter(r => r.severity === 'critical' || r.severity === 'high');
      
      const prompt = `
        You are an elite Silicon Valley Strategic Sourcing and Legal Expert.
        Generate a "Renegotiation Playbook" for a ${contract.category} vendor: ${contract.vendorName}.

        ### CONTEXTUAL INTEL:
        - CURRENT ANNUAL COST: $${(contract.annualCost || 0).toLocaleString()}
        - MARKET AVERAGE: $${benchmarks.avg_annual_cost.toLocaleString()}
        - COST DEVIATION: ${costDelta.toFixed(1)}% vs Market
        - CONTRACT HEALTH SCORE: ${contract.intelligenceAnalysis?.riskScore || "Unknown"}
        
        ### IDENTIFIED VULNERABILITIES (LEVERAGE):
        - CRITICAL RISKS: ${criticalRisks.map(r => r.riskTitle).join(", ") || "None"}
        - KEY CLAUSES: ${contractClauses.slice(0, 5).map((c: any) => c.category + ": " + c.riskLevel).join(", ") || "Standard"}

        ### INSTRUCTIONS:
        1. Identify 3 critical leverage points.
        2. Set a realistic "Target Savings" percentage or amount based on the cost delta.
        3. Provide a "Board-Ready" negotiation script snippet.
        4. Maintain a high-tech, executive, and decisive tone.

        Return JSON format:
        {
          "leveragePoints": ["string"],
          "targetSavings": "string",
          "scriptSnippet": "string",
          "marketComparison": "string"
        }
      `;

      const content = await IntelligenceGateway.createCompletion({
        model: "gpt-4o", // Premium model for executive logic
        messages: [{ role: "system", content: "You generate executive-level vendor negotiation strategies in JSON format." }, { role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
      if (!content) throw new Error("Intelligence failed to generate playbook");

      const result = JSON.parse(content);
      
      // Inject live benchmark data for the UI to display comparison badges
      result.benchmarks = {
        marketAvg: benchmarks.avg_annual_cost,
        delta: costDelta,
        status: costDelta > 0 ? "OVERPAYING" : "MARKET_LEADER"
      };

      // Persist the playbook for historical tracking
      await storage.createPlaybook({
        workspaceId: contract.workspaceId!,
        name: `Strategic Playbook: ${contract.vendorName}`,
        description: `Intelligence-generated negotiation strategy for ${contract.category} services. Rules identified: ${result.leveragePoints.join(", ")}`,
        category: contract.category,
      });

      return result;
    } catch (error: any) {
      console.error("[PLAYBOOK SERVICE ERROR]", error.message);
      throw error;
    }
  }
}
