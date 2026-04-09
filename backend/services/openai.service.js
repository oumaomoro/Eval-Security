import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Analyze a cybersecurity contract text using GPT-4
 * Hardened with try/catch and Safe Mode fallback.
 */
export async function analyzeContract(contractText) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an expert cybersecurity contract analyst specializing in Kenyan law (KDPA), GDPR, ISO 27001, and CBK regulations. 
          Analyze contracts and return structured JSON assessment.`
        },
        {
          role: 'user',
          content: `Analyze this contract and return a JSON object with executive summary, risk scores, key dates, sla metrics, risk flags, compliance gaps, and recommendations.
          
          Text: ${contractText.slice(0, 8000)}`
        }
      ],
      max_tokens: 2000
    });
    return JSON.parse(completion.choices[0].message.content);
  } catch (err) {
    console.error('❌ [OpenAI] analyzeContract error:', err.message);
    return {
      summary: "Contract analysis is currently in Safe Mode due to AI service limits. Basic structural checks are active.",
      overall_risk_score: 50,
      compliance_score: 0,
      key_dates: { start_date: null, end_date: null, renewal_date: null, notice_period_days: null },
      sla_metrics: { uptime_guarantee: null, response_time_hours: null, penalty_clauses: false },
      risk_flags: [{ title: "AI Analysis Offline", severity: "medium", description: "The deep-intelligence engine is currently in safe mode. Please review manually.", regulation: "System" }],
      compliance_gaps: [],
      missing_clauses: [],
      recommendations: ["Ensure manual review of confidentiality and liability clauses while AI services are being restored."]
    };
  }
}

/**
 * Generate a professionally-worded contract clause
 * Hardened with try/catch and Safe Mode fallback.
 */
export async function generateClause({ category, standards, requirements, tone }) {
  try {
    const toneMap = {
      'balanced': 'balanced, fair to both parties',
      'client-favorable': 'strongly client-protective and liability-limiting',
      'vendor-favorable': 'vendor-protective with reasonable client obligations'
    };

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are a senior legal counsel specializing in cybersecurity and technology contracts. Generate precise, enforceable contract clauses.'
        },
        {
          role: 'user',
          content: `Generate a professional ${category.replace('_', ' ')} clause complying with ${standards.join(', ')}.`
        }
      ],
      max_tokens: 1200
    });
    return JSON.parse(completion.choices[0].message.content);
  } catch (err) {
    console.error('❌ [OpenAI] generateClause error:', err.message);
    return {
      clause_category: category,
      generated_text: `[SAFE MODE] The ${category} clause cannot be generated at this time. Standard template language: The parties agree to comply with all applicable data protection laws including ${standards.join(', ')}.`,
      applicable_standards: standards,
      key_provisions: ["Standard Compliance"],
      risks_mitigated: ["Regulatory Compliance"],
      implementation_notes: "AI Generation is currently unavailable. Please use the standard template library.",
      ai_confidence: 0
    };
  }
}

/**
 * Compare contract clauses against standard library
 * Hardened with try/catch and Safe Mode fallback.
 */
export async function compareContractClauses(contractText, clauseLibrary) {
  try {
    const libSummary = clauseLibrary.map(c => `${c.clause_name}: ${c.standard_language.slice(0, 100)}`).join('\n');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are an expert legal analyst. Compare contract clauses and identify gaps.' },
        { role: 'user', content: `Compare contract against standard library:\n\n${libSummary}\n\nContract: ${contractText.slice(0, 5000)}` }
      ],
      max_tokens: 2000
    });
    return JSON.parse(completion.choices[0].message.content);
  } catch (err) {
    console.error('❌ [OpenAI] compareContractClauses error:', err.message);
    return {
      overall_score: 0,
      clauses: clauseLibrary.map(c => ({
        clause_name: c.clause_name,
        status: "partial",
        deviation: "moderate",
        current_language: "Pending AI comparison...",
        risk_implication: "Requires manual verification while AI service is limited.",
        recommendation: "Review against standard clause library."
      })),
      key_recommendations: ["Perform manual comparison against regulatory standards."],
      missing_critical: 0
    };
  }
}

/**
 * Phase 11: Map a contract specifically against global regulatory frameworks (GDPR/CCPA Focus)
 * Hardened with try/catch and Safe Mode fallback.
 */
export async function analyzeDpaFramework(contractText, framework) {
  try {
    const selectedContext = framework?.toUpperCase() || 'General Data Privacy';
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: `You are an elite DPO. Map the contract against ${selectedContext}.` },
        { role: 'user', content: `Map this contract against ${selectedContext}. Text: ${contractText.slice(0, 8000)}` }
      ],
      max_tokens: 3000
    });
    return JSON.parse(completion.choices[0].message.content);
  } catch (err) {
    console.error('❌ [OpenAI] analyzeDpaFramework error:', err.message);
    return {
      framework: framework || "General Privacy",
      overall_readiness_score: 0,
      matrix: [],
      critical_vulnerabilities: ["AI Compliance Mapping is temporarily in Safe Mode due to service limits."]
    };
  }
}

export default { analyzeContract, generateClause, compareContractClauses, analyzeDpaFramework };

