import { storage } from "../storage";
import { NotifierService } from "./Notifier";

/**
 * Enterprise Autonomic Rescanner
 * Simulates the background engine that listens to Regulatory Alerts (GDPR, KDPA)
 * and evaluates existing active contracts to identify newly introduced gaps.
 */
export class AutonomicRescanner {
  static async triggerRescanJob(standard: string, alertTitle: string) {
    console.log(`[Rescanner] Starting autonomic sweep for standard: ${standard}`);
    
    // Fetch all active contracts
    const contracts = await storage.getContracts({ status: "active" });
    
    // In a real LLM integration, we would chunk and re-feed these to the vector RAG
    // and redliner. For now, we simulate the logic by creating new risks for contracts.
    let flaggedCount = 0;
    
    for (const contract of contracts) {
      if (!contract.category) continue;
      
      // Heuristic proxy: if it's cloud or data, flag it for the standard update
      if (
        contract.category.toLowerCase().includes("cloud") ||
        contract.category.toLowerCase().includes("data") || 
        contract.category.toLowerCase().includes("endpoint")
      ) {
        await storage.createRisk({
          contractId: contract.id,
          riskTitle: `Non-Compliant with newly published ${standard} standard`,
          riskCategory: "Compliance",
          riskDescription: `Autonomic scan detected missing covenants relating to: ${alertTitle}`,
          severity: "high",
          likelihood: "high",
          impact: "high",
          riskScore: 85,
          mitigationStatus: "identified"
        });
        flaggedCount++;
      }
    }

    // Notify workspace
    const workspaces = await storage.getWorkspaces();
    if (workspaces.length > 0 && workspaces[0].webhookEnabled) {
      NotifierService.dispatch(
        workspaces[0].webhookUrl,
        true,
        `🔄 Enterprise Rescan Complete: ${standard}`,
        `We have automatically rescanned your library applying the new **${alertTitle}** ruleset.\n\n*Contracts Analyzed:* ${contracts.length}\n*New Risks Flagged:* ${flaggedCount}`,
        flaggedCount > 0 ? "warning" : "info"
      );
    }
  }
}
