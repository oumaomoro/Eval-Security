import OpenAI from "openai";
import { storage } from "../storage";
import memoize from "memoizee";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const cachedAuditAnalysis = memoize(
  (params: any) => openai.chat.completions.create(params),
  { promise: true, maxAge: 3600000, normalizer: (args: any[]) => JSON.stringify(args) }
);

export class GovernanceAuditor {
  static async generatePostureReport() {
    try {
      console.log("[GOVERNANCE AUDITOR] Initiating AI Posture Review...");
      
      const [logs, audits, risks] = await Promise.all([
        storage.getAuditLogs(),
        storage.getComplianceAudits(),
        storage.getRisks()
      ]);

      const systemPrompt = `You are the Chief Governance Officer (CGO) for an enterprise SaaS platform.
        Analyze the provided system audit logs, compliance results, and risk register entries.
        Generate a high-fidelity "Governance Posture Report" in JSON format.
        Focus on:
        1. Operational Resilience (Autofix success rate)
        2. Compliance Drift (Audit trends)
        3. Critical Risk Exposure
        4. Strategic Recommendations.`;

      const userPrompt = `
        Audit Logs (Sample): ${JSON.stringify(logs.slice(0, 20))}
        Compliance Audits: ${JSON.stringify(audits.slice(0, 5))}
        Active Risks: ${JSON.stringify(risks.filter(r => r.mitigationStatus !== 'mitigated'))}
        
        Return JSON:
        {
          "overallStatus": "Optimal" | "Caution" | "Critical",
          "resilienceIndex": number (0-100),
          "complianceHealth": number (0-100),
          "executiveSummary": "...",
          "topRecommendations": ["...", "..."],
          "predictiveAnalysis": "Short forecast of potential risks in the next 30 days."
        }`;

      const response = await cachedAuditAnalysis({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
      });

      const report = JSON.parse(response.choices[0].message.content || "{}");
      console.log("[GOVERNANCE AUDITOR] AI Posture Review Completed.");
      return report;
    } catch (err) {
      console.error("[GOVERNANCE AUDITOR] AI Analysis Failed:", err);
      return {
          overallStatus: "Caution",
          resilienceIndex: 0,
          complianceHealth: 0,
          executiveSummary: "Autonomous auditing currently unavailable. Manual oversight required.",
          topRecommendations: ["Verify AI Integration", "Check System Logs"],
          predictiveAnalysis: "Unavailable"
      };
    }
  }
}
