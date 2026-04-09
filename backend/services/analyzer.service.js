import { openai } from '../config/openai.js';
import { scrubPII } from './security.utils.js';
import { findSimilarGoldStandard } from './vector.service.js';
import { supabase } from './supabase.service.js';
import crypto from 'crypto';
import { kv } from '@vercel/kv';

/**
 * Modular Analyzer Service: High-accuracy, Global, Cost-Efficient
 * Implementing professional, innovative tiered model routing (Multi-Model Strategy).
 */
export class AnalyzerService {
  /**
   * Resilience Wrapper: Exponential Backoff for transient 429/5xx errors.
   * High ROI: Prevents expensive large-document crashes from common AI bottlenecks.
   */
  static async _withRetry(fn, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err) {
        const isRateLimit = err.status === 429 || err.message?.includes('rate_limit');
        if (i === retries - 1 || !(isRateLimit || err.status >= 500)) throw err;
        console.warn(`[Retry ${i + 1}/${retries}] Pausing for ${delay}ms after:`, err.message);
        await new Promise(r => setTimeout(r, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }

  /**
   * Main entry point for modular analysis.
   * Performs metadata extraction, categorical clause identification, and vector matching.
   */
  static async analyze(text, options = {}) {
    console.log('🚀 Starting Global Enterprise Analysis...');
    const scrubbedText = scrubPII(text);
    const targetLang = options.targetLanguage || 'English';

    // 1. Pass 1: Global Context Discovery
    const contextPrompt = `Identify sector and primary jurisdiction of this contract.
    Contract text: ${scrubbedText.substring(0, 5000)}`;

    const contextResult = await this.routeAIModel(contextPrompt, 'low', false, options);
    const { sector, jurisdiction, agreement_type } = this.parseContext(contextResult);

    // 2. Pass 2: Professional Metadata & Structural Extraction
    const extractionPrompt = `Analyze this ${agreement_type || 'contract'} and extract findings into structured JSON.
    Sector: ${sector}, Jurisdiction: ${jurisdiction}
    
    SPECIAL INSTRUCTIONS:
    - AI SAFETY: For each finding, provide a "confidence_score" between 0 and 1.
    - REGIONAL COMPLIANCE: Match analysis strictly against the GOLD STANDARD for **${jurisdiction}**.
    - MULTI-LANGUAGE REQUIREMENT: Output string fields MUST BE in **${targetLang}**.
    
    Structure:
    {
      "metadata": { "vendor_name": "string", "product_service": "string", "annual_cost": 0, "renewal_date": "YYYY-MM-DD" },
      "categorized_findings": [
        {
          "category": "legal" | "security" | "compliance" | "financial",
          "title": "string",
          "description": "string",
          "severity": "critical" | "high" | "medium" | "low",
          "verbatim_text": "string",
          "confidence_score": 0.0-1.0
        }
      ],
      "compliance_readiness": 0-100
    }

    Contract Text: ${scrubbedText}`;

    const extractionResult = await this.routeAIModel(extractionPrompt, 'low', true, options);
    const analysisResult = JSON.parse(extractionResult);

    // 3. Pass 3: Innovative Vector Matching & High-Precision Delta Analysis
    const enrichedFindings = [];
    for (const finding of analysisResult.categorized_findings) {
      if (finding.verbatim_text) {
        const vectorMatch = await findSimilarGoldStandard(finding.verbatim_text, finding.category, sector, jurisdiction);

        if (vectorMatch && vectorMatch.similarity > 0.6) {
          const clauseHash = crypto.createHash('sha256').update(finding.verbatim_text).digest('hex');
          const frameworkContext = `JURISDICTION_${jurisdiction}_SECTOR_${sector}`;

          const { data: cached } = await supabase.from('clause_cache').select('*').eq('clause_hash', clauseHash).eq('framework_context', frameworkContext).single();

          if (cached) {
            finding.gold_standard_alignment = cached.analysis_json;
          } else {
            const gapAnalysis = await this.generateDeltaAnalysis(finding.verbatim_text, vectorMatch.clause_text, options);
            const suggestedRedline = await this.generateRedline(finding.verbatim_text, vectorMatch.clause_text, finding.category, options);

            const alignment = {
              match: vectorMatch.clause_text,
              similarity: Math.round(vectorMatch.similarity * 100),
              standard: vectorMatch.standard_name,
              gap_analysis: gapAnalysis,
              suggested_redline: suggestedRedline
            };

            await supabase.from('clause_cache').insert({ clause_hash: clauseHash, framework_context: frameworkContext, analysis_json: alignment });
            finding.gold_standard_alignment = alignment;
          }
        } else {
          finding.gold_standard_alignment = {
            match: "No specific Gold Standard defined.",
            similarity: 0,
            standard: "Review Required",
            gap_analysis: `⚠️ **Regional Compliance Gap.** Establish a jurisdictional baseline for **${jurisdiction}**.`,
            suggested_redline: "Pending Legal Review."
          };
        }
      }
      enrichedFindings.push(finding);
    }

    return {
      ...analysisResult.metadata,
      detected_sector: sector,
      detected_jurisdiction: jurisdiction,
      agreement_type: agreement_type,
      ai_analysis: {
        ...analysisResult,
        categorized_findings: enrichedFindings
      },
      gold_standard_similarity: this.generateSimilarityMap(enrichedFindings)
    };
  }

  /**
   * Enterprise Premium Deep Scan Method
   * Uses GPT-4 for all phases, ignores ROI cache, provides alternative suggestions.
   */
  static async analyzeDeep(text, options = {}) {
    console.log('🚀 Starting Enterprise Deep Scan Analysis...');

    const targetLang = options.targetLanguage || 'English';
    const complexity = 'high'; // Force high complexity (GPT-4) for all tasks

    // 1. Pass 1: Global Context Discovery
    const contextPrompt = `Perform a comprehensive legal metadata analysis. Identify the industry sector (e.g., Healthcare, FinTech, SaaS, Insurance), primary jurisdiction, and the exact agreement type of this contract text.
    Contract text: ${text.substring(0, 5000)}`;

    const contextResult = await this.routeAIModel(contextPrompt, complexity, false, options);
    const { sector, jurisdiction, agreement_type } = this.parseContext(contextResult);

    // 2. Pass 2: Deep Extraction & Risk Matrix
    const extractionPrompt = `Perform a rigorous legal risk assessment on this ${agreement_type || 'contract'}.
    Sector: ${sector}, Jurisdiction: ${jurisdiction}, Type: ${agreement_type}
    
    SPECIAL INSTRUCTIONS (DEEP SCAN):
    - Identify hidden liabilities, ambiguous termination clauses, and non-standard indemnifications.
    - Provide alternative clause suggestions for any high or critical severity finding.
    - Be highly critical of vendor caps on liability and SLA remedies.
    - MULTI-LANGUAGE REQUIREMENT: All output string fields MUST BE fully translated natively into **${targetLang}**. JSON keys must remain exact English.
    
    Structure:
    {
      "metadata": {
        "vendor_name": "string",
        "product_service": "string",
        "annual_cost": 0,
        "renewal_date": "YYYY-MM-DD"
      },
      "categorized_findings": [
        {
          "category": "legal" | "security" | "compliance" | "financial",
          "title": "Extended Risk Title",
          "description": "Deep legal analysis and consequence if ignored",
          "severity": "critical" | "high" | "medium" | "low",
          "verbatim_text": "Exact text extracted",
          "alternative_suggestion": "Proposed alternative legal language or mitigation strategy"
        }
      ],
      "compliance_readiness": 0-100
    }

    Contract Text: ${text}`;

    const extractionResult = await this.routeAIModel(extractionPrompt, complexity, true);
    const analysisResult = JSON.parse(extractionResult);

    // 3. Vector Matching & Enrichment (Bypass cache for precision deep scan)
    const enrichedFindings = [];
    for (const finding of analysisResult.categorized_findings) {
      if (finding.verbatim_text) {
        const vectorMatch = await findSimilarGoldStandard(finding.verbatim_text, finding.category, sector, jurisdiction);

        if (vectorMatch && vectorMatch.similarity > 0.5) { // Looser matching for broader alignment in deep scan
          const gapAnalysis = await this.generateDeltaAnalysis(finding.verbatim_text, vectorMatch.clause_text, options);
          const suggestedRedline = await this.generateRedline(finding.verbatim_text, vectorMatch.clause_text, finding.category, options);

          finding.gold_standard_alignment = {
            match: vectorMatch.clause_text,
            similarity: Math.round(vectorMatch.similarity * 100),
            standard: vectorMatch.standard_name,
            gap_analysis: gapAnalysis,
            suggested_redline: suggestedRedline
          };
        } else {
          // Deep Scan Option B Implementation
          finding.gold_standard_alignment = {
            match: "No specific Gold Standard defined for this market.",
            similarity: 0,
            standard: "Critical Review Required",
            gap_analysis: `⚠️ **Critical Regional Gap.** Our deep scan found no proprietary baseline for **${jurisdiction}** (${sector}). This represents high latent risk. Establish localized SLAs and caps based on East/Central/South African precedents before signing.`,
            suggested_redline: "Immediate Legal Escalation Recommended."
          };
        }
      }
      enrichedFindings.push(finding);
    }

    return {
      ...analysisResult.metadata,
      detected_sector: sector,
      detected_jurisdiction: jurisdiction,
      agreement_type: agreement_type,
      is_deep_scan: true,
      ai_analysis: {
        ...analysisResult,
        categorized_findings: enrichedFindings
      },
      gold_standard_similarity: this.generateSimilarityMap(enrichedFindings)
    };
  }

  /**
   * THE INTELLIGENT MODEL ROUTER (Cost-Efficiency Integration)
   * High complexity tasks use gpt-4o, Low complexity tasks use gpt-4o-mini.
   */
  static async routeAIModel(prompt, complexity = 'low', isJson = false, options = {}) {
    const model = complexity === 'high' ? 'gpt-4o' : 'gpt-4o-mini';
    console.log(`📡 Routing task [${complexity}] to model: ${model}`);

    const cacheKey = `ai_cache:${crypto.createHash('sha256').update(model + '_' + prompt).digest('hex')}`;
    try {
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        const cached = await kv.get(cacheKey);
        if (cached) {
          console.log(`[Cache Hit] ⚡ Vercel KV returned response instantly for ${model}`);
          return cached;
        }
      }
    } catch (e) {
      console.warn('[KV Cache Warning] Failed to reach Redis:', e.message);
    }

    const completion = await this._withRetry(() => openai.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: prompt }],
      response_format: isJson ? { type: "json_object" } : undefined,
      temperature: complexity === 'high' ? 0.3 : 0.7
    }));

    const result = completion.choices[0].message.content;
    const usage = completion.usage;

    // ── PHASE 14: ASYNC USAGE LOGGING ──────────────────────────────────
    if (usage && options.userId) {
      this.logUsage(options.userId, options.organizationId, model, usage, options.feature || 'contract_analysis')
        .catch(err => console.error('[UsageLog] Failed to persist telemetry:', err.message));
    }
    // ───────────────────────────────────────────────────────────────────

    try {
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        await kv.set(cacheKey, result, { ex: 604800 }); // Cache for 7 days
      }
    } catch (e) { }

    return result;
  }

  /**
   * Persists AI token consumption to the database for billing telemetry.
   */
  static async logUsage(userId, organizationId, model, usage, feature) {
    const { error } = await supabase.from('usage_logs').insert({
      user_id: userId,
      organization_id: organizationId,
      model: model,
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
      total_tokens: usage.total_tokens,
      feature: feature
    });
    if (error) throw error;
  }

  /**
   * Innovative 'Delta Analysis' (High Accuracy Sector Analysis)
   */
  static async generateDeltaAnalysis(extractedText, goldText, options = {}) {
    const deltaPrompt = `As a Senior Data Protection Officer, compare the 'Extracted Vendor Clause' against our 'Internal Gold Standard'.
    Identify MISSING legal protections or UNSAFE modifications.
    
    EXTRACTED: "${extractedText}"
    GOLD STANDARD: "${goldText}"
    
    Output exactly ONE punchy sentence highlighting the critical delta. Be competitive and professional.
    MULTI-LANGUAGE REQUIREMENT: YOU MUST TRANSLATE THE DELTA TEXT INTO **${options.targetLanguage || 'English'}**.`;

    // High complexity task - use gpt-4o for maximum accuracy.
    return await this.routeAIModel(deltaPrompt, 'high');
  }

  /**
   * Innovative 'AI Redlining': Proposes a legally sound replacement clause.
   */
  static async generateRedline(originalText, goldText, category = 'legal', options = {}) {
    // Phase 18: Inject Custom RAG Enterprise clauses if any match the category
    let customContext = '';
    if (options.customClauses && options.customClauses.length > 0) {
      const relevantCustoms = options.customClauses.filter(c => c.category === category);
      if (relevantCustoms.length > 0) {
        customContext = `
    CRITICAL ENTERPRISE RAG OVERRIDE:
    The organization has provided their bespoke CUSTOM GOLD STANDARD for this category.
    You MUST prioritize blending the Global Standard with this CUSTOM ENTERPRISE REQUIREMENT when drafting the redline:
    ${relevantCustoms.map(c => `[${c.name}]: ${c.text}`).join('\n')}
    `;
      }
    }

    const redlinePrompt = `As a Senior Legal Counsel, rewrite the following extracted vendor clause to be fully compliant with our Gold Standard.
    The goal is to maintain the original contract's context while replacing the risky language with our preferred protections.
    
    EXTRACTED CLAUSE: "${originalText}"
    GOLD STANDARD REQUIREMENT: "${goldText}"
    CATEGORY: ${category}
    ${customContext}
    
    Output ONLY the rewritten clause text. No explanations. Be professional, risk-averse, and competitive.
    MULTI-LANGUAGE REQUIREMENT: YOU MUST TRANSLATE THE FINAL REDLINE TEXT INTO **${options.targetLanguage || 'English'}**.`;

    // High complexity task - precision is key.
    return await this.routeAIModel(redlinePrompt, 'high');
  }

  static parseContext(text) {
    const t = text.toLowerCase();
    const isDPA = t.includes('data processing') || t.includes('dpa') || t.includes('privacy');
    const isMSA = t.includes('master service') || t.includes('msa') || t.includes('subscription') || t.includes('software as a service');

    // Detect Region
    let jurisdiction = 'Global';
    if (t.includes('kenya') || t.includes('kdpa')) jurisdiction = 'Kenya (KDPA)';
    else if (t.includes('south africa') || t.includes('popia')) jurisdiction = 'South Africa (POPIA)';
    else if (t.includes('nigeria') || t.includes('ndpr')) jurisdiction = 'Nigeria (NDPR)';
    else if (t.includes('uganda') || t.includes('tanzania') || t.includes('rwanda')) jurisdiction = 'East Africa (EAC)';
    else if (t.includes('gdpr') || t.includes('european')) jurisdiction = 'EU (GDPR)';

    // Detect Sector
    let sector = 'General';
    if (t.includes('healthcare') || t.includes('hipaa') || t.includes('medical')) sector = 'Healthcare';
    else if (t.includes('fintech') || t.includes('banking') || t.includes('cbk') || t.includes('payment')) sector = 'FinTech';
    else if (t.includes('insurance') || t.includes('ira')) sector = 'Insurance';
    else if (t.includes('telecom') || t.includes('communication')) sector = 'Telecom';

    return {
      sector,
      jurisdiction,
      agreement_type: isDPA ? 'DPA' : isMSA ? 'SaaS MSA' : 'General Contract'
    };
  }

  static generateSimilarityMap(findings) {
    const map = {};
    findings.forEach(f => {
      if (f.gold_standard_alignment) {
        map[f.title] = {
          match: f.gold_standard_alignment.match,
          similarity: f.gold_standard_alignment.similarity,
          standard: f.gold_standard_alignment.standard,
          gap_analysis: f.gold_standard_alignment.gap_analysis
        };
      }
    });
    return map;
  }
}
