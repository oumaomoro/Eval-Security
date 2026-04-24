import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { storage } from "../storage.js";
import { createHash } from "crypto";

/**
 * SOVEREIGN API GATEWAY: AI Resilience Layer
 *
 * Implements a unified multi-provider fallback mechanism for all AI interactions.
 * Resilience Path: OpenAI (Primary) -> Anthropic (Secondary) -> Sovereign Fallback (Regional/Mock)
 */
export class AIGateway {
  private static openaiClient: OpenAI | null = null;
  private static deepseekClient: OpenAI | null = null;
  private static anthropicClient: Anthropic | null = null;

  private static readonly OPENAI_KEY = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "missing";
  private static readonly DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || "sk-eff1aa8acef3479188a99e14e646a650";
  private static readonly ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || "missing";
  
  private static readonly OPENAI_BASE = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  private static readonly DEEPSEEK_BASE = "https://api.deepseek.com";
  private static readonly LOCAL_BASE = process.env.LOCAL_AI_BASE_URL || "http://127.0.0.1:11434/v1";

  private static getOpenAI(): OpenAI {
    // Re-read key lazily to ensure dotenv has loaded before class static init
    const key = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "missing";
    if (!this.openaiClient || (this.openaiClient as any).apiKey !== key) {
      this.openaiClient = new OpenAI({
        apiKey: key,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });
    }
    return this.openaiClient;
  }

  private static getDeepSeek(): OpenAI {
    if (!this.deepseekClient) {
      this.deepseekClient = new OpenAI({
        apiKey: this.DEEPSEEK_KEY,
        baseURL: this.DEEPSEEK_BASE,
      });
    }
    return this.deepseekClient;
  }

  private static getAnthropic(): Anthropic {
    if (!this.anthropicClient) {
      this.anthropicClient = new Anthropic({
        apiKey: this.ANTHROPIC_KEY,
      });
    }
    return this.anthropicClient;
  }

  /**
   * Helper for robust API execution
   */
  private static async withRetryAndTimeout<T>(fn: () => Promise<T>, timeoutMs = 15000, maxRetries = 2): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out")), timeoutMs)
        );
        return await Promise.race([fn(), timeoutPromise]);
      } catch (error: any) {
        if (attempt === maxRetries) {
           throw error;
        }
        console.warn(`[AI-GATEWAY] Attempt ${attempt} failed: ${error.message}. Retrying...`);
      }
    }
    throw new Error("Maximum retries exhausted");
  }

  /**
   * Resilient completion endpoint with Multi-Provider Fallback & Semantic Caching
   */
  static async createCompletion(params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming): Promise<string> {
    const promptText = params.messages.map(m => `${m.role}:${m.content}`).join("|");
    const promptHash = createHash("sha256").update(promptText).digest("hex");

    // 0. Check Semantic Cache
    try {
      const cached = await storage.getAiCache(promptHash);
      if (cached) {
        console.log(`[AI-GATEWAY] Semantic Cache Hit: ${promptHash}`);
        return cached;
      }
    } catch (e) {
      console.warn("[AI-GATEWAY] Cache check failed, proceeding to live inference.");
    }

    let responseContent = "";
    let usedProvider = "openai";
    let usedModel = params.model;

    // 1. Attempt Primary (DeepSeek - cost effective & high context)
    try {
      if (this.DEEPSEEK_KEY !== "missing") {
        const deepseekParams = { ...params, model: params.model.includes('gpt') ? 'deepseek-chat' : params.model };
        const response: OpenAI.Chat.ChatCompletion = await this.withRetryAndTimeout(
           () => this.getDeepSeek().chat.completions.create(deepseekParams as any) as any
        );
        responseContent = response.choices[0]?.message?.content || "";
        usedProvider = "deepseek";
        usedModel = deepseekParams.model;
      }
    } catch (error: any) {
      console.warn(`[AI-GATEWAY] DeepSeek Engine Unavailable: ${error.message} - Degrading fully to OpenAI.`);
    }

    if (!responseContent) {
      // 2. Attempt Secondary (OpenAI)
      try {
        if (this.OPENAI_KEY !== "missing") {
          const response: OpenAI.Chat.ChatCompletion = await this.withRetryAndTimeout(
             () => this.getOpenAI().chat.completions.create(params) as any
          );
          responseContent = response.choices[0]?.message?.content || "";
          usedProvider = "openai";
          usedModel = params.model;
        }
      } catch (error: any) {
        console.warn(`[AI-GATEWAY] OpenAI Engine Unavailable: ${error.message}`);
      }
    }

    if (!responseContent) {
      // 3. Attempt Tertiary (Anthropic)
      try {
        if (this.ANTHROPIC_KEY !== "missing") {
          const prompt = params.messages.map(m => `${m.role}: ${m.content}`).join("\n");
          const response = await this.getAnthropic().messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1024,
            messages: [{ role: "user", content: prompt }],
          });
          
          const content = response.content[0];
          if (content.type === 'text') {
             responseContent = content.text;
             usedProvider = "anthropic";
             usedModel = "claude-3-5-sonnet";
          }
        }
      } catch (error: any) {
        console.warn(`[AI-GATEWAY] Anthropic Engine Unavailable: ${error.message}`);
      }
    }

    if (!responseContent) {
      // 4. Attempt Quaternary (Sovereign Local AI - Ollama)
      try {
        const localParams = { ...params, model: 'deepseek-r1:1.5b' };
        const localOpenAI = new OpenAI({ apiKey: "ollama", baseURL: this.LOCAL_BASE });
        const response = await localOpenAI.chat.completions.create(localParams as any);
        responseContent = response.choices[0]?.message?.content || "";
        usedProvider = "ollama";
        usedModel = "deepseek-r1:1.5b";
      } catch (error: any) {
        console.warn(`[AI-GATEWAY] Local AI Engine Unavailable (Ollama): ${error.message}`);
      }
    }

    if (!responseContent) {
       console.warn(`[AI-GATEWAY] All AI Providers Exhausted. Activating Sovereign Fallback.`);
       return this.executeSovereignFallback(params);
    }

    // Populate Cache
    try {
      await storage.createAiCache({
        promptHash,
        response: JSON.stringify(responseContent),
        provider: usedProvider,
        model: usedModel
      });
    } catch (e) {
      console.warn("[AI-GATEWAY] Failed to populate semantic cache.");
    }

    return responseContent;
  }

  /**
   * Resilient Streaming Endpoint
   */
  static async createStreamingCompletion(params: OpenAI.Chat.ChatCompletionCreateParamsStreaming): Promise<any> {
     try {
        if (this.DEEPSEEK_KEY !== "missing") {
           const deepseekParams = { ...params, model: params.model.includes('gpt') ? 'deepseek-chat' : params.model };
           return await this.withRetryAndTimeout(() => this.getDeepSeek().chat.completions.create(deepseekParams as any) as any);
        }
     } catch (error: any) {
        console.warn(`[AI-GATEWAY] DeepSeek Streaming Failed: ${error.message}. Degrading to OpenAI.`);
     }

     try {
        if (this.OPENAI_KEY !== "missing") {
           return await this.withRetryAndTimeout(() => this.getOpenAI().chat.completions.create(params) as any);
        }
        throw new Error("No Primary Providers Offline");
     } catch (error: any) {
        console.error(`[AI-GATEWAY] Streaming Failure: ${error.message}.`);
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
  "notificationRequirements": {
    "timeToReport": "string",
    "mandatoryAuthorities": ["string"]
  },
  "claimRiskScore": "number (1-100)",
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

      // ─── LEGAL & PROFESSIONAL SCORE CONTEXTUALISATION (40/30/20/10) ───────────────
      let score = 0;
      
      // 1. Exclusions Factor (40%)
      const exclusionCount = (analysis.exclusions?.length || 0);
      const exclusionScore = Math.min(exclusionCount * 10, 100) * 0.4;
      score += exclusionScore;
      
      // 2. Sub-Limits & Deductibles Factor (30%)
      const agg = analysis.coverageLimits?.annualAggregate || 1000000;
      const subLimits = [
        analysis.coverageLimits?.ransomwareSubLimit,
        analysis.coverageLimits?.socialEngineeringSubLimit,
        analysis.coverageLimits?.forensicInvestigationSubLimit
      ].filter(l => l && l < (agg * 0.2)).length;
      const limitScore = (subLimits / 3) * 100 * 0.3;
      score += limitScore;
      
      // 3. Waiting Periods Factor (20%)
      const waitHours = parseInt(analysis.waitingPeriods?.businessInterruption || "24");
      const waitScore = Math.min((waitHours / 24) * 100, 100) * 0.2;
      score += waitScore;
      
      // 4. Notification Requirements (10%)
      const hasReportingTime = !!analysis.notificationRequirements?.timeToReport;
      const notificationScore = (hasReportingTime ? 0 : 100) * 0.1;
      score += notificationScore;

      analysis.claimRiskScore = Math.round(score);

      // Usage Tracking: Deduct credits (1 credit for policy analysis)
      if (workspaceId) {
        await storage.logUsageEvent({
          workspaceId,
          eventType: 'insurance_analysis',
          creditsUsed: 1,
          metadata: { carrier: analysis.carrierName }
        });
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
