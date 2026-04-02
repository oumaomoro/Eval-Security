import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { supabase, isSupabaseConfigured } from '../services/supabase.service.js';
import { analyzeDpaFramework } from '../services/openai.service.js';
import { logAuditAction } from '../services/audit.service.js';

const router = express.Router();



// GET /api/compliance/audits
router.get('/audits', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('compliance_audits')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ success: true, data: data || [] });
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/compliance/remediation
router.get('/remediation', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('remediation_tasks')
      .select('*')
      .eq('user_id', req.user.id)
      .order('due_date', { ascending: true });
    if (error) throw error;
    return res.json({ success: true, data: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/compliance/remediation/:id
router.patch('/remediation/:id', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const { data, error } = await supabase
      .from('remediation_tasks')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();
    if (error) throw error;
    return res.json({ success: true, data });
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

  } catch (err) {
    console.error('[Compliance] DPO Matrix Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/compliance/dpo/alert
router.post('/dpo/alert', authenticateToken, async (req, res) => {
  try {
    const { dpoEmail, dpoName, vendorName, riskLevel, actionRequired } = req.body;

    const { EmailService } = await import('../services/email.service.js');
    await EmailService.sendDpoComplianceAlert(dpoEmail, dpoName, vendorName, riskLevel, actionRequired);

    await logAuditAction(req.user.id, null, 'DPO_ALERT_SENT', `Compliance alert dispatched to ${dpoEmail} for ${vendorName}`, req);

    res.json({ success: true, message: 'DPO alert dispatched successfully' });
  } catch (err) {
    console.error('[Compliance] DPO Alert Error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
