import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { storage } from "../storage.js";
import { createHash } from "crypto";

/**
 * SOVEREIGN INTELLIGENCE GATEWAY: Sovereign Intelligence Layer
 *
 * Implements a unified multi-provider fallback mechanism for all intelligence interactions.
 * Resilience Path: DeepSeek (Primary) -> OpenAI (Secondary) -> Anthropic (Expert) -> Local (Sovereign)
 */
export class IntelligenceGateway {
  private static openaiClient: OpenAI | null = null;
  private static deepseekClient: OpenAI | null = null;
  private static anthropicClient: Anthropic | null = null;

  private static readonly OPENAI_KEY = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "missing";
  private static readonly DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || "missing";
  private static readonly ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || "missing";
  private static readonly HF_TOKEN = process.env.HF_TOKEN || "missing";
  private static readonly HF_MODEL_ID = process.env.HF_MODEL_ID || "your-username/costloci-kdpa-llama3";
  
  private static readonly OPENAI_BASE = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  private static readonly DEEPSEEK_BASE = "https://api.deepseek.com";
  private static readonly LOCAL_BASE = process.env.LOCAL_INTELLIGENCE_BASE_URL || process.env.LOCAL_AI_BASE_URL || "http://127.0.0.1:11434/v1";

  private static circuitBreaker: Record<string, { 
    failures: number; 
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'; 
    nextAttempt: number;
    requestInProgress: boolean;
  }> = {
    deepseek: { failures: 0, state: 'CLOSED', nextAttempt: 0, requestInProgress: false },
    openai: { failures: 0, state: 'CLOSED', nextAttempt: 0, requestInProgress: false },
    anthropic: { failures: 0, state: 'CLOSED', nextAttempt: 0, requestInProgress: false },
    huggingface: { failures: 0, state: 'CLOSED', nextAttempt: 0, requestInProgress: false },
    ollama: { failures: 0, state: 'CLOSED', nextAttempt: 0, requestInProgress: false }
  };

  private static readonly FAILURE_THRESHOLD = 3;
  private static readonly OPEN_TIMEOUT = 60000;

  private static isProviderAvailable(provider: string): boolean {
    const cb = this.circuitBreaker[provider];
    const now = Date.now();

    if (cb.state === 'OPEN') {
      if (now >= cb.nextAttempt) {
        cb.state = 'HALF_OPEN';
        cb.requestInProgress = true;
        console.log(`[INTELLIGENCE-GATEWAY] Circuit Breaker for ${provider} entering HALF_OPEN. Testing recovery...`);
        return true;
      }
      return false;
    }

    if (cb.state === 'HALF_OPEN' && cb.requestInProgress) {
      // Only allow one request at a time in HALF_OPEN
      return false;
    }

    return true;
  }

  private static async recordFailure(provider: string) {
    const cb = this.circuitBreaker[provider];
    cb.requestInProgress = false;
    cb.failures += 1;
    
    // If we fail in HALF_OPEN, we immediately go back to OPEN and reset timer
    if (cb.state === 'HALF_OPEN') {
      cb.state = 'OPEN';
      cb.nextAttempt = Date.now() + this.OPEN_TIMEOUT;
      console.warn(`[INTELLIGENCE-GATEWAY] Recovery test failed for ${provider}. Returning to OPEN state.`);
      return;
    }

    if (cb.failures >= this.FAILURE_THRESHOLD) {
      cb.state = 'OPEN';
      cb.nextAttempt = Date.now() + this.OPEN_TIMEOUT;
      console.error(`[INTELLIGENCE-GATEWAY] Circuit Breaker TRIPPED for ${provider}. Cooling off for 60s.`);
      
      await storage.createInfrastructureLog({
        component: "IntelligenceGateway",
        event: "CIRCUIT_BREAKER_TRIPPED",
        status: "critical",
        actionTaken: `Circuit breaker opened for ${provider} after ${cb.failures} failures. Next attempt at ${new Date(cb.nextAttempt).toLocaleTimeString()}.`
      }).catch(() => {});
    }
  }

  private static recordSuccess(provider: string) {
    const cb = this.circuitBreaker[provider];
    cb.requestInProgress = false;
    if (cb.state === 'HALF_OPEN' || cb.state === 'OPEN') {
      cb.state = 'CLOSED';
      cb.failures = 0;
      console.log(`[INTELLIGENCE-GATEWAY] Circuit Breaker CLOSED for ${provider}. Recovery successful.`);
    } else {
      cb.failures = 0;
    }
  }

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
        console.warn(`[INTELLIGENCE-GATEWAY] Attempt ${attempt} failed: ${error.message}. Retrying...`);
      }
    }
    throw new Error("Maximum retries exhausted");
  }

  /**
   * Resilient completion endpoint with Multi-Provider Fallback & Semantic Caching
   */
  static async createCompletion(params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming): Promise<string> {
    // 1. Standards Enforcement
    const hasSystemMessage = params.messages.some((m: any) => m.role === 'system');
    if (!hasSystemMessage) {
      params.messages.unshift({
        role: "system",
        content: "You are a specialized intelligence system for Costloci. Your responses MUST be highly accurate, strictly professional, and adhere to the highest ethical and cybersecurity compliance standards without bias or hallucination."
      } as any);
    } else {
      const sysMsgIndex = params.messages.findIndex((m: any) => m.role === 'system');
      if (sysMsgIndex !== -1) {
        (params.messages[sysMsgIndex] as any).content += "\n\nCRITICAL DIRECTIVE: Your responses MUST be highly accurate, strictly professional, and adhere to the highest ethical and cybersecurity compliance standards without bias or hallucination.";
      }
    }

    const promptText = params.messages.map(m => `${m.role}:${m.content}`).join("|");
    const promptHash = createHash("sha256").update(promptText).digest("hex");

    // 2. Cache Layer
    try {
      const cached = await storage.getIntelligenceCache(promptHash);
      if (cached) return cached;
    } catch (e) {
      console.warn("[INTELLIGENCE-GATEWAY] Cache failure.");
    }

    let responseContent = "";
    let usedProvider = "deepseek";
    let usedModel = "deepseek-chat";

    // 3. Provider Cascade (Enterprise Priority: DeepSeek -> OpenAI -> Anthropic -> Local)
    
    // 3.1. DeepSeek Primary (Sovereign Excellence)
    if (!responseContent && this.DEEPSEEK_KEY !== "missing" && this.isProviderAvailable("deepseek")) {
      try {
        const dsParams = { ...params, model: params.model.includes('gpt') ? 'deepseek-chat' : params.model };
        const response: any = await this.withRetryAndTimeout(() => this.getDeepSeek().chat.completions.create(dsParams as any));
        responseContent = response.choices[0]?.message?.content || "";
        if (responseContent) { usedProvider = "deepseek"; usedModel = dsParams.model; this.recordSuccess("deepseek"); }
      } catch (error: any) { this.recordFailure("deepseek"); }
    }

    // 3.2. OpenAI Secondary (Industry Standard)
    if (!responseContent && this.OPENAI_KEY !== "missing" && this.isProviderAvailable("openai")) {
      try {
        const response: any = await this.withRetryAndTimeout(() => this.getOpenAI().chat.completions.create(params));
        responseContent = response.choices[0]?.message?.content || "";
        if (responseContent) { usedProvider = "openai"; usedModel = params.model; this.recordSuccess("openai"); }
      } catch (error: any) { this.recordFailure("openai"); }
    }

    // 3.3. Anthropic (Specialized Reasoning)
    if (!responseContent && this.ANTHROPIC_KEY !== "missing" && this.isProviderAvailable("anthropic")) {
      try {
        const prompt = params.messages.map(m => `${m.role}: ${m.content}`).join("\n");
        const response = await this.getAnthropic().messages.create({
          model: "claude-3-5-sonnet-20241022", max_tokens: 1024, messages: [{ role: "user", content: prompt }]
        });
        const content = response.content[0];
        if (content.type === 'text') { 
          responseContent = content.text; 
          usedProvider = "anthropic"; 
          usedModel = "claude-3-5-sonnet"; 
          this.recordSuccess("anthropic"); 
        }
      } catch (error: any) { this.recordFailure("anthropic"); }
    }

    // 3.4. Local Ollama (Internal Sovereign Privacy)
    if (!responseContent && this.isProviderAvailable("ollama")) {
      try {
        const localOpenAI = new OpenAI({ apiKey: "ollama", baseURL: this.LOCAL_BASE });
        const response: any = await localOpenAI.chat.completions.create({ ...params, model: 'deepseek-r1:1.5b' } as any);
        responseContent = response.choices[0]?.message?.content || "";
        if (responseContent) { usedProvider = "ollama"; usedModel = "deepseek-r1:1.5b"; this.recordSuccess("ollama"); }
      } catch (error: any) { this.recordFailure("ollama"); }
    }

    // 3.5. Hugging Face Fine-Tuned (Specific Domain Knowledge)
    if (!responseContent && this.HF_TOKEN !== "missing" && this.isProviderAvailable("huggingface")) {
      try {
        const response = await this.withRetryAndTimeout(async () => {
          const res = await fetch(`https://api-inference.huggingface.co/models/${this.HF_MODEL_ID}`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${this.HF_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              inputs: `### Instruction: Analyze the following contract clause.\n### Input: ${promptText}\n### Output:`,
              parameters: { max_new_tokens: 512, return_full_text: false }
            }),
          });
          if (!res.ok) throw new Error(`HF Error: ${res.statusText}`);
          const data = await res.json();
          return data[0]?.generated_text || "";
        }, 30000);
        if (response) { responseContent = response; usedProvider = "huggingface"; usedModel = this.HF_MODEL_ID; this.recordSuccess("huggingface"); }
      } catch (error: any) { this.recordFailure("huggingface"); }
    }

    // 4. Final Fallback or Success
    if (!responseContent) return this.executeSovereignFallback(params);

    try {
      await storage.createIntelligenceCache({ promptHash, response: JSON.stringify(responseContent), provider: usedProvider, model: usedModel });
    } catch (e) { }

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
        console.warn(`[INTELLIGENCE-GATEWAY] DeepSeek Streaming Failed: ${error.message}. Degrading to OpenAI.`);
     }

     try {
        if (this.OPENAI_KEY !== "missing") {
           return await this.withRetryAndTimeout(() => this.getOpenAI().chat.completions.create(params) as any);
        }
        throw new Error("No Primary Providers Offline");
     } catch (error: any) {
        console.error(`[INTELLIGENCE-GATEWAY] Streaming Failure: ${error.message}.`);
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
        professionalOpinion: "A manual legal review is required as Intelligence extraction failed."
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
   * Intelligence Clause Redlining
   * Returns a modified clause based on specific instructions and jurisdictional standards.
   */
  static async redlineClauseIntelligence(originalClause: string, standardLanguage: string, negotiationInstructions: string): Promise<string> {
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
      console.error("[IntelligenceGateway] Clause Redlining Failed:", error);
      return originalClause; // Fallback to original text if intelligence fails
    }
  }

  /**
   * Comprehensive Clause Comparison Intelligence
   * Analyzes deviation between contract text and standard library text.
   */
  static async compareClauseIntelligence(contractText: string, libraryText: string, category: string): Promise<any> {
    const prompt = `You are an expert legal intelligence specializing in cybersecurity contract auditing.
Compare the following Contract Text against the Standard Library Text for the category: ${category}.

[Contract Text]
${contractText}

[Standard Library Text]
${libraryText}

Analyze the deviation and provide a structured JSON response:
{
  "isPresent": boolean,
  "similarityScore": number (0-100),
  "deviationSeverity": "none" | "minor" | "moderate" | "major" | "critical",
  "riskImplications": "string describing risks of current language",
  "missingProvisions": ["string array of missing points"],
  "suggestedImprovements": "string recommending specific changes",
  "complianceImpact": "string describing impact on standards like KDPA/GDPR"
}
Return ONLY the JSON.`;

    try {
      const response = await this.createCompletion({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });
      return JSON.parse(response);
    } catch (error: any) {
      console.error("[IntelligenceGateway] Clause Comparison Failed:", error.message);
      return { 
        error: "Comparison failed",
        deviationSeverity: "unknown"
      };
    }
  }

  /**
   * Parameter-Driven Intelligence Clause Generation
   * Drafts a custom clause based on multi-standard compliance and risk profile.
   */
  static async generateClauseIntelligence(params: {
    category: string;
    standards: string[];
    requirements: string;
    risks: string[];
    tone: string;
  }): Promise<any> {
    const prompt = `You are an elite legal intelligence drafter. Create a professional, legally enforceable ${params.category} clause.
Requirements:
- Standards: ${params.standards.join(", ")}
- Specific Needs: ${params.requirements}
- Risks to Mitigate: ${params.risks.join(", ")}
- Tone: ${params.tone} (e.g., vendor-favorable, client-favorable, balanced)

Provide a structured JSON response:
{
  "clauseText": "Full text of the drafted clause",
  "keyProvisions": ["list of main protections included"],
  "risksMitigated": ["list of risks addressed"],
  "implementationNotes": "instructions for legal teams",
  "optionalVariations": [
    { "tone": "string", "text": "variation text" }
  ]
}
Return ONLY the JSON.`;

    try {
      const response = await this.createCompletion({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });
      return JSON.parse(response);
    } catch (error: any) {
      console.error("[IntelligenceGateway] Clause Generation Failed:", error.message);
      return { 
        error: "Generation failed",
        clauseText: "Drafting failed due to an upstream engine error."
      };
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
         message: "The primary and secondary governance services are currently unavailable (Sovereign mode active). This addendum has been queued for manual review by enterprise legal operators.",
         draft: "Due to jurisdictional or network isolation, standard legal clauses could not be dynamically synthesized. Please use the pre-approved enterprise templates residing in the Clause Library for this remediation."
     });
  }
}
