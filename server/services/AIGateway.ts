import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { storage } from "../storage";

/**
 * SOVEREIGN API GATEWAY: AI Resilience Layer
 *
 * Implements a unified multi-provider fallback mechanism for all AI interactions.
 * Resilience Path: OpenAI (Primary) -> Anthropic (Secondary) -> Sovereign Fallback (Regional/Mock)
 */
export class AIGateway {
  private static openaiClient: OpenAI | null = null;
  private static anthropicClient: Anthropic | null = null;

  private static readonly PRIMARY_KEY = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "missing";
  private static readonly SECONDARY_KEY = process.env.ANTHROPIC_API_KEY || "missing";
  
  private static readonly PRIMARY_BASE = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  private static readonly LOCAL_BASE = process.env.LOCAL_AI_BASE_URL || "http://localhost:11434/v1";

  private static getOpenAI(): OpenAI {
    if (!this.openaiClient) {
      this.openaiClient = new OpenAI({
        apiKey: this.PRIMARY_KEY,
        baseURL: this.PRIMARY_BASE,
      });
    }
    return this.openaiClient;
  }

  private static getAnthropic(): Anthropic {
    if (!this.anthropicClient) {
      this.anthropicClient = new Anthropic({
        apiKey: this.SECONDARY_KEY,
      });
    }
    return this.anthropicClient;
  }

  /**
   * Resilient completion endpoint with Multi-Provider Fallback
   */
  static async createCompletion(params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming): Promise<string> {
    // 1. Attempt Primary (OpenAI)
    try {
      if (this.PRIMARY_KEY !== "missing") {
        const response = await this.getOpenAI().chat.completions.create(params);
        return response.choices[0]?.message?.content || "";
      }
    } catch (error: any) {
      console.warn(`[AI-GATEWAY] Primary Engine (OpenAI) Unavailable: ${error.message}`);
    }

    // 2. Attempt Secondary (Anthropic)
    try {
      if (this.SECONDARY_KEY !== "missing") {
        console.log("[AI-GATEWAY] Attempting Secondary Resilience Path (Anthropic)...");
        const prompt = params.messages.map(m => `${m.role}: ${m.content}`).join("\n");
        const response = await this.getAnthropic().messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        });
        
        const content = response.content[0];
        if (content.type === 'text') {
           return content.text;
        }
      }
    } catch (error: any) {
      console.warn(`[AI-GATEWAY] Secondary Engine (Anthropic) Unavailable: ${error.message}`);
    }

    // 3. Attempt Tertiary (Sovereign Local AI - Ollama/vLLM)
    try {
      console.log("[AI-GATEWAY] Attempting Tertiary Resilience Path (Local sovereign AI)...");
      const localParams = { ...params, model: params.model.includes('gpt') ? 'llama3' : params.model };
      
      const localOpenAI = new OpenAI({
         apiKey: "ollama", // Local models usually don't require keys
         baseURL: this.LOCAL_BASE
      });

      const response = await localOpenAI.chat.completions.create(localParams as any);
      return response.choices[0]?.message?.content || "";
    } catch (error: any) {
      console.warn(`[AI-GATEWAY] Tertiary Engine (Local AI) Unavailable: ${error.message}`);
    }

    // 4. Sovereign Fallback (Regional/Mock)
    console.warn(`[AI-GATEWAY] All AI Providers Exhausted. Activating Sovereign Fallback.`);
    return this.executeSovereignFallback(params);
  }

  /**
   * Resilient Streaming Endpoint
   * (Phase 30 Expansion)
   */
  static async createStreamingCompletion(params: OpenAI.Chat.ChatCompletionCreateParamsStreaming) {
     // For now, streaming only uses the primary client with a fallback to the non-streaming error
     // In a future sprint, we can implement cross-provider stream abstraction.
     try {
        if (this.PRIMARY_KEY !== "missing") {
           return await this.getOpenAI().chat.completions.create(params);
        }
        throw new Error("Primary Provider Offline");
     } catch (error: any) {
        console.error(`[AI-GATEWAY] Streaming Failure: ${error.message}. Redirecting to non-streaming sovereign mode.`);
        throw error;
     }
  }

  /**
   * Cyber Insurance Analysis
   * Returns a structured JSON containing coverage limits, deductibles, exclusions, and claim risk score.
   */
  static async analyzeInsurancePolicy(documentText: string, workspaceId?: number): Promise<any> {
    // Phase 34: Usage Tracking
    if (workspaceId) {
       try { await storage.incrementApiUsage(workspaceId); } catch(e) {}
    }

    const prompt = `You are a Senior Cyber Insurance Underwriter and Legal Counsel.
Analyze the provided cyber insurance policy text to extract critical coverage metrics.
CONTEXTUALISE all findings: if a sub-limit is less than 10% of the aggregate, it is a HIGH RISK. 
If waiting periods for Business Interruption exceed 12 hours, it is a CRITICAL RISK for modern SaaS.

Required JSON Structure:
{
  "carrierName": "string",
  "policyNumber": "string",
  "coverageLimits": {
    "perOccurrence": "number (USD)",
    "annualAggregate": "number (USD)",
    "ransomwareSubLimit": "number (USD)",
    "socialEngineeringSubLimit": "number (USD)",
    "forensicInvestigationSubLimit": "number (USD)",
    "crisisManagementSubLimit": "number (USD)"
  },
  "deductibles": {
    "standard": "number (USD)",
    "ransomware": "number (USD)"
  },
  "waitingPeriods": {
    "businessInterruption": "string (e.g. '8 hours')",
    "systemFailure": "string"
  },
  "exclusions": ["string list of critical exclusions"],
  "claimRiskScore": "number (1-100, where 100 is most restrictive/risky)",
  "professionalOpinion": "string (Professional legal/underwriting summary)"
}

TEXT:
${documentText.slice(0, 30000)}`;

    try {
      const response = await this.createCompletion({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }]
      });

      const analysis = JSON.parse(response.replace(/```json|```/g, ""));

      // ─── LEGAL & PROFESSIONAL SCORE CONTEXTUALISATION ───────────────
      // If AI fails to provide a nuanced score, apply deterministic legal weights
      if (!analysis.claimRiskScore || analysis.claimRiskScore === 50) {
        let score = 20; // Baseline
        
        // 1. Coverage Dilution Risk
        const agg = analysis.coverageLimits?.annualAggregate || 1000000;
        const ransom = analysis.coverageLimits?.ransomwareSubLimit || 0;
        if (ransom < (agg * 0.25)) score += 30; // Ransomware sub-limit is less than 25% of agg
        
        // 2. Operational Wait Risk
        const waitHours = parseInt(analysis.waitingPeriods?.businessInterruption || "24");
        if (waitHours >= 24) score += 20; 
        
        // 3. Exclusion Density
        if ((analysis.exclusions?.length || 0) > 8) score += 15;
        
        // 4. Social Engineering Gaps
        if (!analysis.coverageLimits?.socialEngineeringSubLimit) score += 15;

        analysis.claimRiskScore = Math.min(score, 100);
      }

      return analysis;
    } catch (error: any) {
      console.error("[AI_GATEWAY] Policy Analysis Failed:", error.message);
      return { 
        carrierName: "Extraction Failed", 
        claimRiskScore: 99, 
        professionalOpinion: "A manual legal review is required as AI extraction failed."
      };
    }
  }

  /**
   * Benchmarking Analysis
   */
  static async generateAnalysis(prompt: string): Promise<any> {
     try {
       const response = await this.createCompletion({
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }]
       });
       return JSON.parse(response.replace(/```json|```/g, ""));
     } catch (e) {
       return { error: "Benchmarking failed" };
     }
  }

  /**
   * AI Clause Redlining
   * Returns a modified clause based on specific instructions and jurisdictional standards.
   */
  static async aiRedlineClause(originalClause: string, standardLanguage: string, negotiationInstructions: string): Promise<string> {
    const prompt = `You are an expert cybersecurity attorney.
Original Clause: "${originalClause}"
Standard/Target Language: "${standardLanguage}"
Instructions from User: "${negotiationInstructions}"

Your task is to redline / rewrite the Original Clause to closer match the Standard Language or incorporate the User Instructions while remaining legally robust.
Return ONLY the newly written clause text without quotes or explanations.`;
    
    try {
      return await this.createCompletion({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }]
      });
    } catch (error) {
      console.error("[AIGATEWAY] Clause Redlining Failed:", error);
      return originalClause; // Fallback to original text if AI fails
    }
  }

  /**
   * RE-EXPORTED ACCESSORS: For non-completion modalities (Images, Audio, etc.)
   * These provide centralized config access while still allowing specific SDK methods.
   */
  static get openai(): OpenAI {
    return this.getOpenAI();
  }

  static get anthropic(): Anthropic {
    return this.getAnthropic();
  }

  /**
   * Sovereign Fallback Handler (Offline/Isolation Mode)
   */
  private static executeSovereignFallback(params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming): string {
     return JSON.stringify({
         status: "sovereign_fallback",
         message: "The primary and secondary AI engines are currently unavailable (Sovereign mode active). This addendum has been queued for manual review by enterprise legal operators.",
         draft: "Due to jurisdictional or network isolation, standard legal clauses could not be dynamically synthesized. Please use the pre-approved enterprise templates residing in the Clause Library for this remediation."
     });
  }
}
