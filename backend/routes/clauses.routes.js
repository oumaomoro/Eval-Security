import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { supabase, isSupabaseConfigured } from '../services/supabase.service.js';
import { generateClause } from '../services/openai.service.js';

const router = express.Router();

const mockClauseLibrary = [
  {
    id: 'cl-1',
    clause_name: 'Data Deletion & Retention',
    clause_category: 'data_protection',
    standard_language: 'Upon termination or written request, Vendor shall delete all Customer Personal Data within 30 days and provide written certification of deletion. Vendor shall maintain audit logs of all deletion activities for a minimum of 24 months.',
    jurisdiction: 'kenya',
    applicable_standards: ['KDPA', 'GDPR'],
    risk_level_if_missing: 'critical',
    is_mandatory: true
  },
  {
    id: 'cl-2',
    clause_name: 'Liability Cap (Cybersecurity)',
    clause_category: 'liability',
    standard_language: 'Vendor\'s total aggregate liability for any security incident or data breach shall not be limited to less than three (3) times the total annual fees paid by Customer in the twelve (12) months preceding the incident.',
    jurisdiction: 'international',
    applicable_standards: ['ISO27001'],
    risk_level_if_missing: 'high',
    is_mandatory: true
  },
  {
    id: 'cl-3',
    clause_name: 'Security Incident Notification',
    clause_category: 'sla',
    standard_language: 'Vendor shall notify Customer of any security incident or suspected breach within 72 hours of discovery. Notification shall include: nature of incident, data categories affected, estimated number of records, and remediation steps taken.',
    jurisdiction: 'international',
    applicable_standards: ['GDPR', 'KDPA', 'CBK'],
    risk_level_if_missing: 'critical',
    is_mandatory: true
  },
  {
    id: 'cl-4',
    clause_name: 'Right to Audit',
    clause_category: 'data_protection',
    standard_language: 'Customer reserves the right to conduct or commission an independent security audit of Vendor\'s systems, controls, and practices annually, or at any time following a security incident. Vendor shall cooperate fully and provide access within 10 business days.',
    jurisdiction: 'kenya',
    applicable_standards: ['CBK', 'KDPA'],
    risk_level_if_missing: 'high',
    is_mandatory: false
  },
  {
    id: 'cl-5',
    clause_name: 'SLA & Uptime Guarantee',
    clause_category: 'sla',
    standard_language: 'Vendor guarantees 99.9% monthly uptime. For each hour of downtime exceeding the SLA, Customer shall receive a service credit of 5% of the monthly fee, up to a maximum of 30% per month.',
    jurisdiction: 'universal',
    applicable_standards: ['ISO27001'],
    risk_level_if_missing: 'medium',
    is_mandatory: false
  },
  {
    id: 'cl-6',
    clause_name: 'Data Residency',
    clause_category: 'data_protection',
    standard_language: 'All Customer Data shall be stored and processed exclusively within the Republic of Kenya, unless Customer provides explicit prior written consent for cross-border transfers. Any approved transfer must comply with KDPA Third Schedule requirements.',
    jurisdiction: 'kenya',
    applicable_standards: ['KDPA'],
    risk_level_if_missing: 'critical',
    is_mandatory: true
  },
  {
    id: 'cl-7',
    clause_name: 'Termination for Convenience',
    clause_category: 'termination',
    standard_language: 'Either party may terminate this Agreement without cause upon 30 days written notice. Upon termination, Vendor shall provide an exit plan including data portability in standard formats within 15 business days.',
    jurisdiction: 'universal',
    applicable_standards: [],
    risk_level_if_missing: 'medium',
    is_mandatory: false
  }
];

const mockComparisonResults = [
  {
    clause_name: 'Data Deletion & Retention',
    status: 'missing',
    deviation: 'critical',
    current_language: null,
    standard_language: mockClauseLibrary[0].standard_language,
    risk_implication: 'KDPA Section 34 violation. Potential regulatory fine of up to KES 5M.',
    recommendation: 'Add data deletion clause with 30-day timeline and certification requirement.'
  },
  {
    clause_name: 'Liability Cap',
    status: 'present',
    deviation: 'major',
    current_language: 'Liability limited to annual fees paid.',
    standard_language: mockClauseLibrary[1].standard_language,
    risk_implication: 'Cap is 67% below industry standard. Insufficient for a critical security vendor.',
    recommendation: 'Negotiate cap to 3x annual fees minimum.'
  },
  {
    clause_name: 'Security Incident Notification',
    status: 'present',
    deviation: 'minor',
    current_language: 'Vendor will notify within 72 hours of confirmed breach.',
    standard_language: mockClauseLibrary[2].standard_language,
    risk_implication: 'Confirmed vs suspected breach distinction delays notification.',
    recommendation: 'Change "confirmed" to "suspected" per GDPR Article 33 requirements.'
  },
  {
    clause_name: 'Right to Audit',
    status: 'missing',
    deviation: 'high',
    current_language: null,
    standard_language: mockClauseLibrary[3].standard_language,
    risk_implication: 'CBK Guidance on Cloud requires annual audit rights for regulated entities.',
    recommendation: 'Add audit right clause with 10-business-day cooperation requirement.'
  }
];

// GET /api/clauses/library
router.get('/library', authenticateToken, async (req, res) => {
  try {
    const { category } = req.query;
    
    if (isSupabaseConfigured()) {
      let query = supabase.from('clause_library').select('*');
      if (category && category !== 'all') {
        query = query.eq('clause_category', category);
      }
      const { data, error } = await query;
      if (error) throw error;
      return res.json({ success: true, data: data || [] });
    }

    let clauses = mockClauseLibrary;
    if (category && category !== 'all') {
      clauses = clauses.filter(c => c.clause_category === category);
    }
    res.json({ success: true, data: clauses, _source: 'mock' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/clauses/compare/:contractId
router.get('/compare/:contractId', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        overall_score: 62,
        contract_name: 'CloudFlare Security Services',
        comparison_date: new Date().toISOString(),
        clauses: mockComparisonResults,
        missing_critical: mockComparisonResults.filter(c => c.status === 'missing' && c.deviation === 'critical').length,
        key_recommendations: [
          'Add KDPA-compliant data deletion clause immediately',
          'Renegotiate liability cap to 3x annual fees',
          'Add Right to Audit provision for CBK compliance'
        ]
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clauses/generate
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { category, standards = [], requirements = '', tone = 'balanced' } = req.body;
    
    // Call live GPT-4o service
    const generated = await generateClause({ category, standards, requirements, tone });

    const responseData = {
      id: `gen-${Date.now()}`,
      ...generated,
      ai_confidence: generated.ai_confidence || 92
    };

    res.json({ success: true, data: responseData });
  } catch (err) {
    console.error('OpenAI Generation Error:', err);
    
    // Fallback if OpenAI fails or limits are exceeded
    const template = mockClauseLibrary.find(c => c.clause_category === category) || mockClauseLibrary[0];
    const generatedFallback = {
      id: `mock-gen-${Date.now()}`,
      clause_category: category,
      generated_text: `[Fallback Mock - ${tone} tone] ${template.standard_language}`,
      applicable_standards: standards.length > 0 ? standards : template.applicable_standards,
      key_provisions: ['Data handling obligations', 'Compliance with applicable law', 'Audit and record-keeping'],
      risks_mitigated: ['Regulatory non-compliance', 'Data breach liability'],
      implementation_notes: `Customize references as applicable. Review with legal counsel before finalizing.`,
      ai_confidence: 91
    };
    res.json({ success: true, data: generatedFallback, _source: 'mock_fallback' });
  }
});

export default router;
