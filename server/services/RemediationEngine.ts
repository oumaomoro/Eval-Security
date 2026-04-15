import OpenAI from "openai";
import { storage } from "../storage";
import { type Contract } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

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
      const categories = [...new Set(nonCompliant.map(f => f.category))];

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

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      // 5. Persist to storage (High-level summary)
      const updatedAnalysis = {
        ...contract.aiAnalysis,
        remediationStatus: 'completed' as const,
        remediationAddendum: result.addendumContent,
        legalAlignmentScore: result.legalAlignmentScore,
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

      return {
        id: contractId,
        status: "remediated",
        score: result.legalAlignmentScore,
        summary: result.remediationSummary,
        addendum: result.addendumContent
      };
    } catch (err) {
      console.error("[REMEDIATION] Execution Failed:", err);
      throw err;
    }
  }
}
