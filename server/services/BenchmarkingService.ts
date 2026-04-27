import { storage } from "../storage.js";
import { IntelligenceGateway } from "./IntelligenceGateway.js";
import type { Contract, SavingsOpportunity } from "../../shared/schema.js";

/**
 * BENCHMARKING SERVICE - PRODUCTION GRADE
 * 
 * Performs Intelligence-driven cost analysis by comparing contract data against 
 * localized market benchmarks (East African focus).
 */
export class BenchmarkingService {
  /**
   * SOVEREIGN MARKET RESEARCH ENGINE
   * If a category lacks benchmarking data, use Intelligence to perform regional market research 
   * and persist the result to the database for future real-time comparisons.
   */
  private static async getOrResearchBenchmark(category: string, serviceName: string): Promise<any[]> {
    const existing = await storage.getVendorBenchmarks(category);
    if (existing && existing.length > 0) return existing;

    console.log(`[BENCHMARK] Category '${category}' missing. Triggering Autonomous Regional Research...`);

    const researchPrompt = `
      You are a specialized cybersecurity procurement analyst focused on the East African market (Kenya, Tanzania, Uganda, Ethiopia).
      Perform research for the following service: '${serviceName}' in the category '${category}'.
      
      Respond in JSON format with a realistic market benchmark based on recent regional deals and infrastructure requirements:
      {
        "serviceType": "string",
        "marketAverageAnnual": number (USD),
        "region": "East Africa",
        "sampleSize": number (realistic data cluster size),
        "reasoning": "string"
      }
    `;

    try {
      const response = await IntelligenceGateway.generateAnalysis(researchPrompt);
      const data = JSON.parse(typeof response === 'string' ? response : JSON.stringify(response));

      const benchmark = await storage.createVendorBenchmark({
        serviceType: data.serviceType || serviceName,
        serviceCategory: category,
        marketAverageAnnual: data.marketAverageAnnual,
        region: data.region || "East Africa",
        sampleSize: data.sampleSize || 5,
      });

      console.log(`[BENCHMARK] Autonomous research complete for ${category}. Persistence successful.`);
      return [benchmark];
    } catch (err) {
      console.error("[BENCHMARK] Autonomous research failed, falling back to baseline speculations.");
      return [];
    }
  }

  /**
   * Analyzes a contract for savings opportunities based on market benchmarks.
   */
  static async analyzeForSavings(contractId: number): Promise<SavingsOpportunity[]> {
    const contract = await storage.getContract(contractId);
    if (!contract) throw new Error("Contract not found for benchmarking");

    console.log(`[BENCHMARK] Analyzing contract ${contractId} (Vendor: ${contract.vendorName}, Category: ${contract.category})`);

    // 1. Fetch or dynamically research relevant benchmarks
    const benchmarks = await this.getOrResearchBenchmark(contract.category || "General Security", contract.productService || "Managed Security Services");
    
    if (benchmarks.length === 0) return [];

    // 2. Use Intelligence to match the contract's service to the closest market benchmark
    const prompt = `
      Analyze this contract and find the closest match in our market benchmark library.
      
      CONTRACT:
      Category: ${contract.category}
      Vendor: ${contract.vendorName}
      Annual Cost: $${contract.annualCost}
      Service: ${contract.productService}
      
      BENCHMARK LIBRARY:
      ${benchmarks.map(b => `- ID: ${b.id}, Type: ${b.serviceType}, Market Savg Annual: $${b.marketAverageAnnual}`).join('\n')}
      
      Respond in JSON format:
      {
        "matchedBenchmarkId": number | null,
        "matchConfidence": number (0-1),
        "analysis": "string explaining why this is a match or mismatch",
        "isAboveMarket": boolean,
        "estimatedSavingsPotential": number
      }
    `;

    try {
      const response = await IntelligenceGateway.generateAnalysis(prompt);
      const result = JSON.parse(typeof response === 'string' ? response : JSON.stringify(response));

      if (result.isAboveMarket && result.estimatedSavingsPotential > 0 && result.matchConfidence > 0.7) {
        console.log(`[BENCHMARK] Savings detected: $${result.estimatedSavingsPotential} potential for ${contract.vendorName}`);
        
        const savingsObj = await storage.createSavingsOpportunity({
          workspaceId: contract.workspaceId || 1,
          contractId: contract.id,
          description: `Identified potential annual savings of $${result.estimatedSavingsPotential} based on East African market benchmarks for ${contract.category}. Analysis: ${result.analysis}`,
          type: "market_pricing_optimization",
          estimatedSavings: result.estimatedSavingsPotential,
          status: "identified"
        });

        return [savingsObj];
      }
    } catch (err: any) {
      console.error("[BENCHMARK] Intelligence Analysis failed:", err.message);
    }

    return [];
  }

  /**
   * Comprehensive portfolio benchmarking
   */
  static async runPortfolioCheck(clientId: number): Promise<void> {
    const contracts = await storage.getContracts({ clientId });
    console.log(`[BENCHMARK] Running portfolio check for client ${clientId} (${contracts.length} contracts)`);
    
    for (const contract of contracts) {
      await this.analyzeForSavings(contract.id);
    }
  }
}
