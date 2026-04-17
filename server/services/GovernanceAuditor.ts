import { AIGateway } from "./AIGateway.js";
import { storage } from "../storage";
import memoize from "memoizee";

const cachedAuditAnalysis = memoize(
  (params: any) => AIGateway.createCompletion(params),
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

      const systemPrompt = `You are the Chief Governance Officer (CGO) for an enterprise SaaS platform specializing in East African regulatory compliance.
        Analyze the provided system audit logs, compliance results, and risk register entries.
        Generate a high-fidelity "Governance Posture Report" in JSON format.
        Focus on:
        1. Operational Resilience (Autofix success rate)
        2. Compliance Drift (Focus on IRA Kenya July 2025 mandates and KDPA DPO requirements)
        3. Critical Risk Exposure (Especially third-party AI and data localization)
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

      const responseText = await cachedAuditAnalysis({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
      });
      
      const report = JSON.parse(responseText || "{}");
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
