import { IntelligenceGateway } from "./IntelligenceGateway.js";

export interface IaCFinding {
  resource: string;
  issue: string;
  severity: "critical" | "high" | "medium" | "low";
  recommendation: string;
}

export class IaCScanner {
  static async scanTerraform(content: string): Promise<IaCFinding[]> {
    const prompt = `Analyze this Terraform configuration for security misconfigurations and best practices.
    Identify issues like:
    - Publicly accessible S3 buckets or databases
    - Missing encryption at rest
    - Overly permissive IAM policies (e.g., Allow All)
    - Unencrypted EBS volumes or RDS instances
    
    Return a structured JSON array of findings with: resource, issue, severity, and recommendation.
    
    Terraform Content:
    ${content}`;

    try {
      const response = await IntelligenceGateway.createCompletion({
        messages: [
          { role: "system", content: "You are a cloud security expert. Analyze the provided IaC code and return a JSON object with a 'findings' array. Each finding must have: resource, issue, severity (critical, high, medium, low), and recommendation. Respond ONLY with the JSON object." },
          { role: "user", content: prompt }
        ],
        model: "gpt-4o",
        response_format: { type: "json_object" }
      });

      const parsed = JSON.parse(response);
      return parsed.findings || [];
    } catch (error: any) {
      console.error("[IaC Scanner] Analysis failed:", error.message);
      return [];
    }
  }
}
