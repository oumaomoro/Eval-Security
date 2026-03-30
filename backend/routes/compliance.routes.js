import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { supabase, isSupabaseConfigured } from '../services/supabase.service.js';
import { analyzeDpaFramework } from '../services/openai.service.js';
import { logAuditAction } from '../services/audit.service.js';

const router = express.Router();

// ── Mock data (fallback when Supabase is not yet configured) ─────────────────
const MOCK_AUDITS = [
  { id: 'audit-1', audit_name: 'Q1 Regulatory Audit', audit_type: 'automated', status: 'completed', overall_compliance_score: 85, standards: ['KDPA', 'GDPR', 'CBK'], created_at: '2026-03-01T10:00:00Z', completed_at: '2026-03-02T09:00:00Z' },
  { id: 'audit-2', audit_name: 'Vendor Risk Assessment', audit_type: 'manual', status: 'completed', overall_compliance_score: 92, standards: ['ISO27001'], created_at: '2026-02-15T14:00:00Z', completed_at: '2026-02-16T11:00:00Z' }
];

const MOCK_TASKS = [
  { id: 'task-1', description: 'Update data retention policy for CloudFlare contract', severity: 'high', status: 'in_progress', due_date: '2026-04-01' },
  { id: 'task-2', description: 'Add KDPA specific clauses to Datadog agreement', severity: 'critical', status: 'todo', due_date: '2026-03-30' }
];

// GET /api/compliance/audits
router.get('/audits', authenticateToken, async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('compliance_audits')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.json({ success: true, data: data || [] });
    }
    res.json({ success: true, data: MOCK_AUDITS, _source: 'mock' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/compliance/audits/run
router.post('/audits/run', authenticateToken, async (req, res) => {
  try {
    const { name, standards = ['KDPA', 'GDPR'] } = req.body;
    const audit = {
      user_id: req.user.id,
      audit_name: name || 'Manual Audit',
      audit_type: 'manual',
      status: 'in_progress',
      standards,
      overall_compliance_score: null,
      created_at: new Date().toISOString()
    };
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('compliance_audits')
        .insert([audit])
        .select()
        .single();
      if (error) throw error;
      // Simulate completion after brief delay
      setTimeout(async () => {
        await supabase
          .from('compliance_audits')
          .update({ status: 'completed', overall_compliance_score: Math.floor(Math.random() * 20) + 75, completed_at: new Date().toISOString() })
          .eq('id', data.id);
      }, 3000);
      return res.json({ success: true, data });
    }
    res.json({ success: true, data: { ...audit, id: `audit-${Date.now()}` }, _source: 'mock' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/compliance/remediation
router.get('/remediation', authenticateToken, async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('remediation_tasks')
        .select('*')
        .eq('user_id', req.user.id)
        .order('due_date', { ascending: true });
      if (error) throw error;
      return res.json({ success: true, data: data || [] });
    }
    res.json({ success: true, data: MOCK_TASKS, _source: 'mock' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/compliance/remediation/:id
router.patch('/remediation/:id', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('remediation_tasks')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .eq('user_id', req.user.id)
        .select()
        .single();
      if (error) throw error;
      return res.json({ success: true, data });
    }
    res.json({ success: true, message: 'Updated (mock mode)' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DPO GOVERNANCE ENDPOINTS ──

// GET /api/compliance/dpo/contacts
router.get('/dpo/contacts', authenticateToken, async (req, res) => {
  try {
    const { data: contacts, error: contactsErr } = await supabase
      .from('dpo_contacts')
      .select('*')
      .eq('user_id', req.user.id);
    if (contactsErr) throw contactsErr;
    res.json({ success: true, data: contacts || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/compliance/dpo/contacts
router.post('/dpo/contacts', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const { data: contact, error: contactErr } = await supabase
      .from('dpo_contacts')
      .insert([{ user_id: req.user.id, name, email, phone }])
      .select()
      .single();
    if (contactErr) throw contactErr;
    res.json({ success: true, data: contact });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/compliance/dpo/tasks
router.get('/dpo/tasks', authenticateToken, async (req, res) => {
  try {
    const { data: tasks, error: tasksErr } = await supabase
      .from('dpo_tasks')
      .select('*')
      .eq('user_id', req.user.id)
      .order('due_date', { ascending: true });
    if (tasksErr) throw tasksErr;
    res.json({ success: true, data: tasks || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/compliance/dpo/tasks/:id
router.patch('/dpo/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const { data: task, error: taskErr } = await supabase
      .from('dpo_tasks')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();
    if (taskErr) throw taskErr;
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/compliance/matrix/:contractId
// (Phase 11: DPO Regulatory Matrix execution via RAG/LLM)
router.post('/matrix/:contractId', authenticateToken, async (req, res) => {
  try {
    const { framework } = req.body; // e.g., 'GDPR', 'CCPA'
    
    if (isSupabaseConfigured()) {
      // 1. Fetch raw contract text
      const { data: contract, error: fetchErr } = await supabase
        .from('contracts')
        .select('contract_text, regulatory_matrices')
        .eq('id', req.params.contractId)
        .eq('user_id', req.user.id)
        .single();
        
      if (fetchErr || !contract) return res.status(404).json({ error: 'Contract not found' });
      
      // 2. Check cache (do we already have this mapped?)
      let matrices = contract.regulatory_matrices || {};
      if (matrices[framework]) {
        return res.json({ success: true, data: matrices[framework], _source: 'cache' });
      }

      // 3. Generate new matrix via OpenAI
      const newMatrix = await analyzeDpaFramework(contract.contract_text || "", framework);

      // 4. Save to DB
      matrices[framework] = newMatrix;
      await supabase
        .from('contracts')
        .update({ regulatory_matrices: matrices })
        .eq('id', req.params.contractId);

      // Phase 11.3: Log DPO Mapping Execution
      await logAuditAction(req.user.id, req.params.contractId, 'DPO_MATRIX_GENERATED', `Dynamic framework mapping initiated for ${framework}. Readiness: ${newMatrix.overall_readiness_score}/100`, req);

      return res.json({ success: true, data: newMatrix });
    }

    // MOCK MODE FALLBACK for instant UI testing
    setTimeout(() => {
      res.json({
        success: true,
        _source: 'mock',
        data: {
          framework: framework || "GDPR Article 28",
          overall_readiness_score: 65,
          matrix: [
            {
              control_id: "Art. 28(3)(a)",
              requirement_name: "Documented Instructions",
              status: "compliant",
              evidence_found: "The processor shall process personal data only on documented instructions from the controller.",
              remediation_action: null
            },
            {
              control_id: "Art. 28(3)(c)",
              requirement_name: "Security of Processing",
              status: "partial",
              evidence_found: "Processor will employ reasonable security measures.",
              remediation_action: "Require explicit references to Article 32 (encryption, pseudonymisation)."
            },
            {
              control_id: "Art. 28(3)(d)",
              requirement_name: "Sub-processing Rules",
              status: "missing",
              evidence_found: null,
              remediation_action: "Add clause strictly forbidding engagement of another processor without prior specific or general written authorisation of the controller."
            }
          ],
          critical_vulnerabilities: [
            "Missing explicit sub-processor authorization requirements.",
            "Vague security obligations do not meet GDPR Article 32 threshold."
          ]
        }
      });
    }, 2000);

  } catch (err) {
    console.error('[Compliance] DPO Matrix Error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
