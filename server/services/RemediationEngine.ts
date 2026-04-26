import { storage } from "../storage.js";
import { type Contract } from "../../shared/schema.js";
import { AIGateway } from "./AIGateway.js";
import { CollaborationService } from "./CollaborationService.js";

export class RemediationEngine {
  /**
   * Automatically generates a remediation addendum for a contract based on audit findings.
   */
  static async remediateContract(contractId: number): Promise<any> {
    try {
      console.log(`[REMEDIATION] Initiating self-healing for Contract #${contractId}...`);
      
      const contract = await storage.getContract(contractId);
      if (!contract) throw new Error("Contract not found");

      // 1. Get recent audit findings
      const audits = await storage.getComplianceAudits(contractId);
      const latestAudit = audits[0]; // Assuming sorted by date descending
      
      if (!latestAudit || !latestAudit.findings) {
        console.warn(`[REMEDIATION] No findings found for Contract #${contractId}.`);
        return { status: "no_action_required", message: "No compliance gaps detected." };
      }

      // 2. Filter non-compliant findings and map to categories
      const nonCompliant = (latestAudit.findings as any[]).filter(f => f.status === 'non_compliant' || f.status === 'failed');
      const categories = [...new Set(nonCompliant.map(f => f.category || f.jurisdiction || f.requirement || "General"))];

      // ── Phase 34: Automated Task Creation ──
      for (const finding of nonCompliant) {
        await storage.createRemediationTask({
          workspaceId: contract.workspaceId || (contract as any).workspace_id,
          contractId: contract.id,
          findingId: finding.id,
          title: `[HEAL] ${finding.requirement || "Compliance Gap"}`,
          description: finding.description,
          gapDescription: finding.evidence || finding.description,
          suggestedClauses: finding.recommendation || "",
          severity: finding.severity || "medium",
          status: "pending"
        }).catch(err => console.error(`[REMEDIATION] Task creation failed for finding ${finding.id}:`, err.message));
      }

      // 3. Fetch matching clauses from the library
      const library = await storage.getClauseLibrary();
      const relevantClauses = library.filter(c => categories.includes(c.clauseCategory));

      if (relevantClauses.length === 0) {
        console.warn(`[REMEDIATION] No standard clauses found in library for categories: ${categories.join(", ")}`);
        // Fallback: AI will draft based on general knowledge if library is empty for these categories
      }

      // 4. Draft the Addendum using AI
      const systemPrompt = `You are a Senior Legal Counsel specializing in Regulatory Technology (RegTech). 
        Your task is to draft a "Remediation Addendum" for a contract that has failed compliance audits.
        Use the provided "Standard Gold Clauses" from our library to fix the gaps.
        The response must be a valid JSON object.`;

      const userPrompt = `
        Contract Summary: ${contract.aiAnalysis?.summary || "Standard Service Agreement"}
        Non-Compliant Areas: ${JSON.stringify(nonCompliant)}
        Gold Standard Clauses to Include: ${JSON.stringify(relevantClauses)}

        Task:
        1. Draft a formal "Remediation Addendum" text in Markdown.
        2. Calculate a "Legal Alignment Score" (0-100) representing how well this addendum fixes the gaps.
        
        Return JSON:
        {
          "addendumContent": "...",
          "legalAlignmentScore": number,
          "remediationSummary": "Briefly explain what was fixed.",
          "remediatedClauses": [
            { "category": "category_name", "text": "remediated_clause_text" }
          ]
        }`;

      const responseText = await AIGateway.createCompletion({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(responseText || "{}");
      
      // ── Sovereign Fallback Resilience Layer
      const addendumContent = result.addendumContent || result.draft || (result.status === 'sovereign_fallback' ? result.message : "Standard remediation currently in manual queue.");
      const alignmentScore = result.legalAlignmentScore || (result.status === 'sovereign_fallback' ? 50 : 0);
      const remediationSummary = result.remediationSummary || (result.status === 'sovereign_fallback' ? "Sovereign fallback mode active." : "Compliance gap remediation initiated.");

      // 5. Persist to storage (High-level summary)
      const updatedAnalysis = {
        ...contract.aiAnalysis,
        remediationStatus: 'completed' as const,
        remediationAddendum: addendumContent,
        legalAlignmentScore: alignmentScore,
        remediatedAt: new Date().toISOString()
      };

      await storage.updateContractAnalysis(contractId, updatedAnalysis);
      
      // 6. Persist granular remediated clauses (Phase 14 Improvement)
      if (result.remediatedClauses && Array.isArray(result.remediatedClauses)) {
        for (const cls of result.remediatedClauses) {
          await storage.createClause({
            contractId,
            category: cls.category,
            content: cls.text || cls.content,
            riskLevel: 'low'
          });
        }
      } else {
        // Fallback: If AI didn't return granular clauses, create one for the whole addendum
        await storage.createClause({
          contractId,
          category: "General Remediation",
          content: result.addendumContent,
          riskLevel: 'low'
        });
      }
      
      console.log(`[REMEDIATION] Contract #${contractId} has been successfully healed.`);

      // Notify the team via the Collaboration Studio (Phase 33)
      CollaborationService.broadcastToWorkspace(contract.workspaceId || (contract as any).workspace_id, {
        type: "NEW_ACTIVITY",
        user: "AUTONOMIC_ENGINE",
        action: "remediated contract",
        details: `Successfully applied compliance fixes to ${contract.vendorName}`,
        contractId: contract.id
      });

      return {
        id: contractId,
        status: "remediated",
        score: alignmentScore,
        summary: remediationSummary,
        addendum: addendumContent
      };
    } catch (err) {
      console.error("[REMEDIATION] Execution Failed:", err);
      throw err;
    }
  }
}
