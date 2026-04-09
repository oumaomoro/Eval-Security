import express from 'express';
import { supabase } from '../services/supabase.service.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * GET /api/workspaces
 * Retrieves all workspaces associated with the user's organization.
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    if (!orgId) return res.json({ success: true, data: [] });

    const { data: workspaces, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', orgId);

    if (error) throw error;
    res.json({ success: true, data: workspaces || [] });
  } catch (err) {
    console.error('[Workspaces] Fetch Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch workspaces' });
  }
});

/**
 * GET /api/workspaces/active
 * Retrieves the specific details of the current active organization.
 */
router.get('/active', authenticateToken, async (req, res) => {
  try {
    if (!req.user.organization_id) throw new Error('No active organization session');

    const { data: workspace, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', req.user.organization_id)
      .single();

    if (error) throw error;
    res.json({ success: true, data: workspace });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch active workspace' });
  }
});

export default router;
