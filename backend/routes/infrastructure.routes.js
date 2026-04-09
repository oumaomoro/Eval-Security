import express from 'express';
import { supabase } from '../services/supabase.service.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { orgScopedQuery } from '../services/db.utils.js';

const router = express.Router();

/**
 * GET /api/infrastructure/logs
 * Retrieves organization-scoped infrastructure forensic logs.
 */
router.get('/logs', authenticateToken, async (req, res) => {
  try {
    const orgId = req.user.organization_id;
    if (!orgId) return res.json({ success: true, data: [] });

    const { data: logs, error } = await supabase
      .from('infrastructure_logs')
      .select('*')
      .eq('organization_id', orgId)
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json({ success: true, data: logs || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch infrastructure logs' });
  }
});

/**
 * GET /api/health/latency
 * Retrieves mock infrastructure latency metrics for the health console.
 */
router.get('/latency', authenticateToken, async (req, res) => {
    // Aggregated from billing_telemetry or simulated locally
    res.json([
        { time: '10:00', latency: 45, throughput: 850 },
        { time: '11:00', latency: 48, throughput: 820 },
        { time: '12:00', latency: 52, throughput: 900 },
        { time: '13:00', latency: 42, throughput: 950 },
        { time: '14:00', latency: 44, throughput: 880 }
    ]);
});

export default router;
