import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { supabase } from '../services/supabase.service.js';

const router = express.Router();

/**
 * GET /api/audit/logs
 * Fetches immutable SOC2/GDPR compliance logs from the `audit_logs` table.
 * Restricted to the authenticated user.
 */
router.get('/logs', authenticateToken, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    // If implementing strict global admin logs later, we would check profile.role === 'admin'
    // but right now, RLS handles users seeing their own org logs.

    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[audit.routes] DB fetching error:', error);
      throw error;
    }

    res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    console.error('[audit.routes] Server Error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs securely.' });
  }
});

export default router;
