import OpenAI from "openai";
import { storage } from "../storage";
import { type Clause } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export class Redliner {
  static async generateRedline(contractId: number, originalText: string, riskDescription: string): Promise<string> {
    // 1. Retrieve organization's standard clause library
    const clauses = await storage.getClauseLibrary();
    
    // 2. Identify relevant standards based on the risk category if possible
    // For now, we provide the full context to AI to find the best match
    const context = clauses.map(c => `- ${c.clauseName}: ${c.standardLanguage}`).join("\n");

    const systemPrompt = `You are a Senior Legal AI specialized in contract redlining.
      Your goal is to suggest a corrected version of a problematic contract clause.
      Use the provided organization standard clause library as the source of truth for 'Ideal' language.
      Ensure the output is professional, enterprise-grade, and strictly addresses the identified risk.
      
      Standard Clause Library:
      ${context}`;

    const userPrompt = `Problematic Clause: "${originalText}"
      Identified Risk: "${riskDescription}"
      
      Suggest a corrected version of this clause that aligns with the organization's standards and mitigates the risk.
      Return ONLY the corrected text, no preamble.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
    });

    const suggestedText = response.choices[0].message.content || "Remediation unavailable at this time.";

    // 3. Store the suggestion in the audit log (or the new table via route)
    return suggestedText.trim();
  }

  // Legacy support for mass analysis
  static async suggestRemediations(contractId: number) {
    // ... preserved for backward compatibility if needed, but we focus on the new per-clause logic
    return { remediations: [] }; 
  }
}
