import { storage } from "../storage.js";
import { IntelligenceGateway } from "./IntelligenceGateway.js";
import { SOC2Logger } from "./SOC2Logger.js";

export class MarketplaceService {
  /**
   * Benchmarks a contract against available marketplace "Gold Standard" clauses.
   * Identifies gaps that could be fixed by purchasing/applying premium marketplace clauses.
   */
  static async benchmarkAgainstMarketplace(contractId: number): Promise<any> {
    try {
      const contract = await storage.getContract(contractId);
      if (!contract) throw new Error("Contract not found");

      const listings = await storage.getMarketplaceListings();
      const verifiedListings = listings.filter(l => l.isVerified);

      const systemPrompt = `You are a Marketplace Intelligence Agent. 
      Your goal is to compare a user's contract against a list of "Gold Standard" marketplace clauses.
      Identify which marketplace items would provide the highest ROI for risk reduction or compliance.
      
      Return a JSON object: { 
        "recommendations": [{ "listingId": number, "title": string, "matchScore": number, "reasoning": string, "potentialRiskReduction": number }],
        "marketBenchmarkScore": number 
      }`;

      const userPrompt = `
      Contract Vendor: ${contract.vendorName}
      Contract Category: ${contract.category}
      Current Risks: ${JSON.stringify(contract.intelligenceAnalysis?.riskFlags || [])}
      
      Available Marketplace Listings: ${JSON.stringify(verifiedListings.map(l => ({ id: l.id, title: l.title, category: l.category })))}
      
      Analyze and suggest the best matches.`;

      const responseText = await IntelligenceGateway.createCompletion({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(responseText || "{}");

      // Update contract analysis with marketplace insights
      const updatedAnalysis = {
        ...contract.intelligenceAnalysis,
        marketplaceInsights: result
      };
      await storage.updateContractAnalysis(contractId, updatedAnalysis);

      return result;
    } catch (err: any) {
      console.error("[MARKETPLACE SERVICE] Benchmark failed:", err);
      throw err;
    }
  }

  /**
   * Suggests insurance policies based on the contract's financial exposure.
   */
  static async suggestInsurance(contractId: number): Promise<any> {
     const risks = await storage.getRisks(contractId);
     const totalExposureMax = risks.reduce((acc, r) => acc + (r.financialExposureMax || 0), 0);
     
     // Mock logic for Phase 34: In a real app, this would query an insurance provider API
     const suggestion = {
       type: "CYBER_LIABILITY",
       recommendedLimit: totalExposureMax * 1.5,
       estimatedPremium: totalExposureMax * 0.005,
       reason: `Total financial exposure identified as $${totalExposureMax.toLocaleString()}. Recommended coverage limit provides 50% buffer.`
     };

     return suggestion;
  }
}
