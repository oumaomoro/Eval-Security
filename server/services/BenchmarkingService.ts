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

    // 2. Use Intelligence to identify multiple savings opportunities
    const prompt = `
      You are an expert Procurement and Cost Optimization Analyst. 
      Analyze this contract against market benchmarks and identify ALL possible savings opportunities.
      
      CONTRACT:
      Category: ${contract.category}
      Vendor: ${contract.vendorName}
      Annual Cost: $${contract.annualCost}
      Service: ${contract.productService}
      
      BENCHMARK LIBRARY:
      ${benchmarks.map(b => `- Type: ${b.serviceType}, Market Average: $${b.marketAverageAnnual}`).join('\n')}
      
      Identify opportunities in these categories:
      - market_pricing_optimization (Price is above market average)
      - vendor_consolidation (Similar services can be merged)
      - license_optimization (Potential over-provisioning)
      - alternative_vendor (Cheaper regional alternatives available)
      
      Respond in JSON format:
      {
        "opportunities": [
          {
            "type": "string",
            "description": "string",
            "estimatedSavings": number,
            "confidence": number (0-1)
          }
        ]
      }
    `;

    try {
      const response = await IntelligenceGateway.generateAnalysis(prompt);
      const result = JSON.parse(typeof response === 'string' ? response : JSON.stringify(response));
      const createdOps: SavingsOpportunity[] = [];

      if (result.opportunities && Array.isArray(result.opportunities)) {
        for (const op of result.opportunities) {
          if (op.estimatedSavings > 0 && op.confidence > 0.6) {
            console.log(`[BENCHMARK] Savings detected: $${op.estimatedSavings} (${op.type}) for ${contract.vendorName}`);
            
            const savingsObj = await storage.createSavingsOpportunity({
              workspaceId: contract.workspaceId || 1,
              contractId: contract.id,
              description: op.description,
              type: op.type,
              estimatedSavings: op.estimatedSavings,
              status: "identified"
            });
            createdOps.push(savingsObj);
          }
        }
      }

      return createdOps;
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
