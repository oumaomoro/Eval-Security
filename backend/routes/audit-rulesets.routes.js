import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { supabase } from '../services/supabase.service.js';

const router = express.Router();

// GET /api/audit-rulesets
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data: rulesets, error } = await supabase
      .from('audit_rulesets')
      .select('*')
      .eq('organization_id', req.user.organization_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(rulesets || []);
  } catch (error) {
    console.error('Fetch rulesets error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/audit-rulesets
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, standard, rules, isCustom } = req.body;
    
    // Auto-migrate standard to standard_code for backend compatibility
    const payload = {
      organization_id: req.user.organization_id,
      name,
      description,
      standard_code: standard,
      is_custom: isCustom,
      rules
    };

    const { data, error } = await supabase
      .from('audit_rulesets')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Create ruleset error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/audit-rulesets/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, standard, rules, isCustom } = req.body;
    const { id } = req.params;

    const payload = {
      name,
      description,
      standard_code: standard,
      is_custom: isCustom,
      rules,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('audit_rulesets')
      .update(payload)
      .eq('id', id)
      .eq('organization_id', req.user.organization_id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Update ruleset error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/audit-rulesets/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('audit_rulesets')
      .delete()
      .eq('id', id)
      .eq('organization_id', req.user.organization_id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Delete ruleset error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
