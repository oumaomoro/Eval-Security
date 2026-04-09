import express from 'express';
import { supabase } from '../services/supabase.service.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * GET /api/billing/telemetry
 * Retrieves organization-scoped billing and usage telemetry.
 */
router.get('/telemetry', authenticateToken, async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    if (!orgId) return res.json({ success: true, data: [] });

    const { data: telemetry, error } = await supabase
      .from('billing_telemetry')
      .select('*')
      .eq('organization_id', orgId)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json({ success: true, data: telemetry || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch billing telemetry' });
  }
});

/**
 * GET /api/billing/usage
 * Retrieves aggregated usage stats for the current billing cycle.
 */
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    if (!orgId) return res.json({ success: true, data: {} });

    const { count, error } = await supabase
      .from('contracts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId);
    
    if (error) throw error;

    res.json({
      success: true,
      data: {
        current_usage: count || 0,
        plan_limit: 50,
        billing_cycle_end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch usage data' });
  }
});

export default router;
