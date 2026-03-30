import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { supabase, isSupabaseConfigured } from '../services/supabase.service.js';

const router = express.Router();

const MOCK_RISKS = [
  { id: 'risk-1', contract_id: 'cont-1', risk_title: 'Limited Liability Ceiling', risk_category: 'financial', risk_description: 'Indemnification cap is set below the 3x annual spend threshold recommended for high-risk vendors.', severity: 'high', likelihood: 'medium', impact: 'high', risk_score: 75, mitigation_status: 'mitigation_planned', financial_exposure: { min_estimate: 50000, max_estimate: 150000 }, ai_confidence: 94 },
  { id: 'risk-2', contract_id: 'cont-2', risk_title: 'Vague Data Deletion Clause', risk_category: 'compliance', risk_description: 'Clause does not specify the 30-day deletion window required by KDPA Section 34.', severity: 'critical', likelihood: 'high', impact: 'high', risk_score: 90, mitigation_status: 'identified', financial_exposure: { min_estimate: 25000, max_estimate: 500000 }, ai_confidence: 98 },
  { id: 'risk-3', contract_id: 'cont-1', risk_title: 'Single-Site Termination', risk_category: 'operational', risk_description: 'Termination for convenience requires 180 days notice without a standard exit plan.', severity: 'medium', likelihood: 'low', impact: 'medium', risk_score: 40, mitigation_status: 'mitigated', financial_exposure: { min_estimate: 10000, max_estimate: 30000 }, ai_confidence: 88 }
];

// GET /api/risk/register
router.get('/register', authenticateToken, async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('risk_register')
        .select('*, contracts(vendor_name, category)')
        .eq('user_id', req.user.id)
        .order('risk_score', { ascending: false });
      if (error) throw error;
      return res.json({ success: true, data: data || [] });
    }
    res.json({ success: true, data: MOCK_RISKS, _source: 'mock' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/risk/register
router.post('/register', authenticateToken, async (req, res) => {
  try {
    const riskData = { ...req.body, user_id: req.user.id };
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('risk_register')
        .insert([riskData])
        .select()
        .single();
      if (error) throw error;
      return res.json({ success: true, data });
    }
    res.json({ success: true, data: { ...riskData, id: `risk-${Date.now()}` }, _source: 'mock' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/risk/register/:id
router.patch('/register/:id', authenticateToken, async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('risk_register')
        .update({ ...req.body, updated_at: new Date().toISOString() })
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

export default router;
