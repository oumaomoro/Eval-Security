import { IntelligenceGateway } from "./IntelligenceGateway.js";

export interface RemediationFix {
  originalAsset: string;
  issue: string;
  remediationCode: string;
  explanation: string;
  safetyRating: "safe" | "caution" | "manual_only";
}

export class SelfHealingEngine {
  static async generateFix(assetName: string, assetType: string, issue: string): Promise<RemediationFix> {
    console.log(`[Self-Healing] Generating fix for ${assetName} (${issue})...`);

    const prompt = `You are a Senior DevSecOps Engineer. 
    We have detected a security issue in our infrastructure.
    
    Asset: ${assetName}
    Type: ${assetType}
    Issue: ${issue}
    
    Provide a Terraform code snippet that fixes this issue. 
    Also provide a brief explanation and a safety rating.
    
    Respond in JSON format:
    {
      "originalAsset": "${assetName}",
      "issue": "${issue}",
      "remediationCode": "terraform code here",
      "explanation": "why this fix works",
      "safetyRating": "safe | caution | manual_only"
    }`;

    try {
      const response = await IntelligenceGateway.createCompletion({
        messages: [
          { role: "system", content: "You are a professional infrastructure automation expert. Return only valid JSON." },
          { role: "user", content: prompt }
        ],
        model: "gpt-4o",
        response_format: { type: "json_object" }
      });

      return JSON.parse(response);
    } catch (error: any) {
      console.error("[Self-Healing] Generation failed:", error.message);
      return {
        originalAsset: assetName,
        issue: issue,
        remediationCode: "# Could not generate fix automatically.",
        explanation: "The healing engine encountered an intelligence timeout.",
        safetyRating: "manual_only"
      };
    }
  }
}
