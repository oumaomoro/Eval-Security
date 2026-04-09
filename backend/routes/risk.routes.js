import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { supabase } from '../services/supabase.service.js';

const router = express.Router();

// GET /api/risk/register — Real-time Supabase fetch, org-scoped
router.get('/register', authenticateToken, async (req, res) => {
  try {
    let query = supabase
      .from('risk_register')
      .select('*, contracts(vendor_name, category)')
      .order('risk_score', { ascending: false });

    // Scope by organization or fall back to user
    if (req.user.organization_id) {
      query = query.eq('organization_id', req.user.organization_id);
    } else {
      query = query.eq('user_id', req.user.id);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('[risk/register GET]', err.message);
    res.status(500).json({ error: 'Failed to fetch risk register.' });
  }
});

// POST /api/risk/register — Create a new risk entry
router.post('/register', authenticateToken, async (req, res) => {
  try {
    const riskData = {
      ...req.body,
      user_id: req.user.id,
      organization_id: req.user.organization_id || null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('risk_register')
      .insert([riskData])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    console.error('[risk/register POST]', err.message);
    res.status(500).json({ error: 'Failed to create risk entry.' });
  }
});

// PATCH /api/risk/register/:id — Update risk status
router.patch('/register/:id', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('risk_register')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    console.error('[risk/register PATCH]', err.message);
    res.status(500).json({ error: 'Failed to update risk entry.' });
  }
});

// DELETE /api/risk/register/:id — Remove a risk
router.delete('/register/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('risk_register')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true, message: 'Risk entry deleted.' });
  } catch (err) {
    console.error('[risk/register DELETE]', err.message);
    res.status(500).json({ error: 'Failed to delete risk entry.' });
  }
});

export default router;
