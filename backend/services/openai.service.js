import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Analyze a cybersecurity contract text using GPT-4
 */
export async function analyzeContract(contractText) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are an expert cybersecurity contract analyst specializing in Kenyan law (KDPA), GDPR, ISO 27001, and CBK regulations. 
        Analyze contracts and return structured JSON assessment. Be precise, professional, and thorough.`
      },
      {
        role: 'user',
        content: `Analyze this cybersecurity contract and return a JSON object with these exact fields:
{
  "summary": "2-3 sentence executive summary",
  "overall_risk_score": <number 0-100, higher = more risk>,
  "compliance_score": <number 0-100>,
  "key_dates": {
    "start_date": "<date or null>",
    "end_date": "<date or null>",
    "renewal_date": "<date or null>",
    "notice_period_days": <number or null>
  },
  "sla_metrics": {
    "uptime_guarantee": "<percentage or null>",
    "response_time_hours": <number or null>,
    "penalty_clauses": <boolean>
  },
  "risk_flags": [
    {"title": "<risk title>", "severity": "<critical|high|medium|low>", "description": "<brief description>", "regulation": "<applicable regulation>"}
  ],
  "compliance_gaps": [
    {"standard": "<KDPA|GDPR|CBK|ISO27001>", "gap": "<description>", "section": "<regulation section>"}
  ],
  "missing_clauses": ["<clause name>"],
  "recommendations": ["<specific actionable recommendation>"]
}

Contract text:
${contractText.slice(0, 8000)}`
      }
    ],
    max_tokens: 2000
  });

  return JSON.parse(completion.choices[0].message.content);
}

/**
 * Generate a professionally-worded contract clause
 */
export async function generateClause({ category, standards, requirements, tone }) {
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
        content: 'You are a senior legal counsel specializing in cybersecurity and technology contracts in East Africa. Generate precise, enforceable contract clauses.'
      },
      {
        role: 'user',
        content: `Generate a professional ${category.replace('_', ' ')} contract clause with these requirements:
- Tone: ${toneMap[tone] || tone}
- Must comply with: ${standards.join(', ')}
- Specific requirements: ${requirements || 'Standard industry best practice'}

Return JSON:
{
  "clause_category": "${category}",
  "generated_text": "<full professionally-worded clause text>",
  "applicable_standards": ${JSON.stringify(standards)},
  "key_provisions": ["<provision 1>", "<provision 2>", "<provision 3>"],
  "risks_mitigated": ["<risk 1>", "<risk 2>"],
  "implementation_notes": "<practical notes for legal team>",
  "optional_variations": "<2-3 alternative formulations as a note>",
  "ai_confidence": <number 85-99>
}`
      }
    ],
    max_tokens: 1200
  });

  return JSON.parse(completion.choices[0].message.content);
}

/**
 * Compare contract clauses against standard library
 */
export async function compareContractClauses(contractText, clauseLibrary) {
  const libSummary = clauseLibrary.map(c => `${c.clause_name}: ${c.standard_language.slice(0, 200)}`).join('\n');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You are an expert legal analyst. Compare contract clauses against standard industry clauses and identify gaps, deviations and risks.'
      },
      {
        role: 'user',
        content: `Compare this contract against these standard clauses and identify deviations:

STANDARD CLAUSES:
${libSummary}

CONTRACT:
${contractText.slice(0, 6000)}

Return JSON:
{
  "overall_score": <number 0-100>,
  "clauses": [
    {
      "clause_name": "<name>",
      "status": "<present|missing|partial>",
      "deviation": "<critical|high|major|moderate|minor|none>",
      "current_language": "<excerpt or null if missing>",
      "risk_implication": "<impact of gap or deviation>",
      "recommendation": "<specific fix>"
    }
  ],
  "key_recommendations": ["<top 3 recommendations>"],
  "missing_critical": <count>
}`
      }
    ],
    max_tokens: 2000
  });

  return JSON.parse(completion.choices[0].message.content);
}

/**
 * Phase 11: Map a contract specifically against global regulatory frameworks (GDPR/CCPA Focus)
 */
export async function analyzeDpaFramework(contractText, framework) {
  const frameworkContexts = {
    'GDPR': 'GDPR Article 28 (Data Processing Agreements)',
    'CCPA': 'CCPA (Service Provider Addendums)',
    'SOC2': 'SOC 2 Type II Vendor Security Constraints'
  };

  const selectedContext = frameworkContexts[framework?.toUpperCase()] || 'General Data Privacy Regulations';

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are an elite Data Privacy Officer (DPO) and Legal Counsel. Your goal is to map the provided contract's text rigidly against the requirements of ${selectedContext}.`
      },
      {
        role: 'user',
        content: `Map this contract against ${selectedContext}. Return a JSON heatmap matrix representing the granular compliance state.
        
CONTRACT TEXT:
${contractText.slice(0, 8000)}

Return strictly in this JSON format:
{
  "framework": "${selectedContext}",
  "overall_readiness_score": <number 0-100>,
  "matrix": [
    {
      "control_id": "<e.g., Art. 28(3)(a)>",
      "requirement_name": "<Short Name of Control>",
      "status": "<compliant|partial|missing|non-compliant>",
      "evidence_found": "<exact text snippet from contract verifying status, or null if missing>",
      "remediation_action": "<actionable advice for the DPO to fix this specific gap>"
    }
  ],
  "critical_vulnerabilities": ["<high level bullet 1>"]
}`
      }
    ],
    max_tokens: 3000
  });

  return JSON.parse(completion.choices[0].message.content);
}

export default { analyzeContract, generateClause, compareContractClauses, analyzeDpaFramework };
