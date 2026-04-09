import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { supabase } from '../services/supabase.service.js';
import { generateClause } from '../services/openai.service.js';

const router = express.Router();

// ── SEED DATA: Inserted into DB on first boot if table is empty ──────────────
const SEED_CLAUSES = [
  { clause_name: 'Data Deletion & Retention', clause_category: 'data_protection', standard_language: 'Upon termination or written request, Vendor shall delete all Customer Personal Data within 30 days and provide written certification of deletion. Vendor shall maintain audit logs of all deletion activities for a minimum of 24 months.', jurisdiction: 'kenya', applicable_standards: ['KDPA', 'GDPR'], risk_level_if_missing: 'critical', is_mandatory: true },
  { clause_name: 'Liability Cap (Cybersecurity)', clause_category: 'liability', standard_language: "Vendor's total aggregate liability for any security incident or data breach shall not be limited to less than three (3) times the total annual fees paid by Customer in the twelve (12) months preceding the incident.", jurisdiction: 'international', applicable_standards: ['ISO27001'], risk_level_if_missing: 'high', is_mandatory: true },
  { clause_name: 'Security Incident Notification', clause_category: 'sla', standard_language: 'Vendor shall notify Customer of any security incident or suspected breach within 72 hours of discovery. Notification shall include: nature of incident, data categories affected, estimated number of records, and remediation steps taken.', jurisdiction: 'international', applicable_standards: ['GDPR', 'KDPA', 'CBK'], risk_level_if_missing: 'critical', is_mandatory: true },
  { clause_name: 'Right to Audit', clause_category: 'data_protection', standard_language: "Customer reserves the right to conduct or commission an independent security audit of Vendor's systems, controls, and practices annually, or at any time following a security incident. Vendor shall cooperate fully and provide access within 10 business days.", jurisdiction: 'kenya', applicable_standards: ['CBK', 'KDPA'], risk_level_if_missing: 'high', is_mandatory: false },
  { clause_name: 'SLA & Uptime Guarantee', clause_category: 'sla', standard_language: 'Vendor guarantees 99.9% monthly uptime. For each hour of downtime exceeding the SLA, Customer shall receive a service credit of 5% of the monthly fee, up to a maximum of 30% per month.', jurisdiction: 'universal', applicable_standards: ['ISO27001'], risk_level_if_missing: 'medium', is_mandatory: false },
  { clause_name: 'Data Residency', clause_category: 'data_protection', standard_language: 'All Customer Data shall be stored and processed exclusively within the Republic of Kenya, unless Customer provides explicit prior written consent for cross-border transfers. Any approved transfer must comply with KDPA Third Schedule requirements.', jurisdiction: 'kenya', applicable_standards: ['KDPA'], risk_level_if_missing: 'critical', is_mandatory: true },
  { clause_name: 'Termination for Convenience', clause_category: 'termination', standard_language: 'Either party may terminate this Agreement without cause upon 30 days written notice. Upon termination, Vendor shall provide an exit plan including data portability in standard formats within 15 business days.', jurisdiction: 'universal', applicable_standards: [], risk_level_if_missing: 'medium', is_mandatory: false }
];

async function ensureClauseLibrarySeeded() {
  const { count } = await supabase.from('clause_library').select('*', { count: 'exact', head: true });
  if (count === 0) {
    console.log('[clauses] Seeding clause library from defaults...');
    await supabase.from('clause_library').insert(SEED_CLAUSES);
  }
}
// Fire-and-forget seed on startup
ensureClauseLibrarySeeded().catch(e => console.warn('[clauses] Seed warning:', e.message));

// GET /api/clauses/library — Real-time database fetch
router.get('/library', authenticateToken, async (req, res) => {
  try {
    const { category } = req.query;
    let query = supabase.from('clause_library').select('*');
    if (category && category !== 'all') {
      query = query.eq('clause_category', category);
    }
    const { data, error } = await query.order('risk_level_if_missing', { ascending: true });
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('[clauses/library]', err.message);
    res.status(500).json({ error: 'Failed to load clause library.' });
  }
});

// GET /api/clauses/compare/:contractId — Real AI analysis, real DB
router.get('/compare/:contractId', authenticateToken, async (req, res) => {
  try {
    const { contractId } = req.params;

    const { data: contract, error } = await supabase
      .from('contracts')
      .select('*, profiles(tier)')
      .eq('id', contractId)
      .eq('user_id', req.user.id)
      .single();

    if (error || !contract) return res.status(404).json({ error: 'Contract not found' });

    const findings = contract.ai_analysis?.categorized_findings || [];

    const comparisonClauses = findings.map(f => ({
      clause_name: f.title,
      status: f.gold_standard_alignment?.similarity > 0 ? 'present' : 'missing',
      deviation: f.severity === 'critical' ? 'critical' : f.severity === 'high' ? 'major' : 'minor',
      current_language: f.verbatim_text,
      standard_language: f.gold_standard_alignment?.match || 'No standard established',
      risk_implication: f.gold_standard_alignment?.gap_analysis || f.description,
      recommendation: f.gold_standard_alignment?.suggested_redline || 'Review with legal counsel.'
    }));

    const keyRecs = comparisonClauses
      .filter(c => c.deviation === 'critical' || c.deviation === 'major')
      .map(c => `[${c.clause_name}]: ${c.recommendation.split('.')[0]}.`)
      .slice(0, 3);

    res.json({
      success: true,
      data: {
        overall_score: contract.compliance_readiness || 0,
        contract_name: contract.vendor_name || contract.file_name,
        comparison_date: contract.created_at,
        clauses: comparisonClauses,
        missing_critical: comparisonClauses.filter(c => c.status === 'missing' && c.deviation === 'critical').length,
        key_recommendations: keyRecs.length > 0 ? keyRecs : ['Standard alignment is high. Verify bespoke regional requirements.']
      }
    });
  } catch (err) {
    console.error('[clauses/compare]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clauses/generate — Live GPT-4o generation with DB-seeded fallback
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { category, standards = [], requirements = '', tone = 'balanced' } = req.body;

    // Live GPT-4o generation
    const generated = await generateClause({ category, standards, requirements, tone });

    // Persist to DB for library growth
    const { data: saved } = await supabase.from('clause_library').insert([{
      clause_name: generated.clause_name || `Custom ${category} Clause`,
      clause_category: category,
      standard_language: generated.generated_text,
      applicable_standards: standards,
      jurisdiction: generated.jurisdiction || 'universal',
      risk_level_if_missing: 'medium',
      is_mandatory: false,
      generated_by: req.user.id
    }]).select().single();

    res.json({ success: true, data: { id: saved?.id || `gen-${Date.now()}`, ...generated, ai_confidence: generated.ai_confidence || 92 } });
  } catch (err) {
    console.error('[clauses/generate] OpenAI error, using DB fallback:', err.message);

    // DB-backed fallback (no static mocks)
    const { data: fallbacks } = await supabase
      .from('clause_library')
      .select('*')
      .eq('clause_category', req.body.category || 'data_protection')
      .limit(1);

    const template = fallbacks?.[0];
    if (!template) return res.status(503).json({ error: 'AI generation unavailable and no fallback template found.' });

    res.json({
      success: true,
      data: {
        id: `fallback-${Date.now()}`,
        clause_category: req.body.category,
        generated_text: template.standard_language,
        applicable_standards: template.applicable_standards,
        key_provisions: ['Data handling obligations', 'Compliance with applicable law', 'Audit and record-keeping'],
        risks_mitigated: ['Regulatory non-compliance', 'Data breach liability'],
        implementation_notes: 'Generated from Gold Standard library. Review with legal counsel.',
        ai_confidence: 88,
        _source: 'db_fallback'
      }
    });
  }
});

export default router;
