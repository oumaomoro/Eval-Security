import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { supabase, isSupabaseConfigured } from '../services/supabase.service.js';
import { CostOptimizerService } from '../services/costOptimizer.service.js';

const router = express.Router();

const MOCK_SAVINGS = [
  { id: 'sav-1', opportunity_type: 'license_right_sizing', vendor_name: 'CrowdStrike', description: 'License utilization audit reveals 40 unused EDR seats out of 200 licensed. Reduction to 160 seats saves $28,800/year.', potential_savings: 28800, confidence: 94, effort: 'low', status: 'identified', category: 'endpoint_protection', action_required: 'Submit license reduction request before renewal (2026-05-01)' },
  { id: 'sav-2', opportunity_type: 'vendor_consolidation', vendor_name: 'Palo Alto + Fortinet', description: 'Overlapping NGFW capabilities. Consolidating onto Palo Alto eliminates $45,000 in redundant Fortinet licensing.', potential_savings: 45000, confidence: 82, effort: 'medium', status: 'under_review', category: 'network_security', action_required: 'Request Palo Alto NGFW feature parity assessment' },
  { id: 'sav-3', opportunity_type: 'pricing_above_market', vendor_name: 'Splunk', description: 'Current SIEM pricing is 23% above median for comparable Kenyan financial institutions.', potential_savings: 25000, confidence: 78, effort: 'medium', status: 'identified', category: 'siem', action_required: 'Prepare benchmark report for renegotiation' },
  { id: 'sav-4', opportunity_type: 'payment_term_optimization', vendor_name: 'Datadog', description: 'Switching from monthly to annual billing achieves a standard 15% discount ($10,800).', potential_savings: 10800, confidence: 98, effort: 'low', status: 'approved', category: 'monitoring', action_required: 'Process annual payment method change with Finance' }
];

const MOCK_BENCHMARKS = [
  { id: 'bm-1', vendor_name: 'CrowdStrike Falcon', category: 'Endpoint Detection & Response', your_cost_per_seat: 180, market_median: 155, market_low: 120, market_high: 220, peers_count: 24, pricing_percentile: 74, status: 'above_market', recommendation: 'Negotiate pricing to market median. Potential 14% reduction.' },
  { id: 'bm-2', vendor_name: 'Splunk SIEM', category: 'Security Information & Event Management', your_annual_cost: 110000, market_annual_median: 85000, peers_count: 18, pricing_percentile: 82, status: 'significantly_above', recommendation: 'Use benchmark data to renegotiate. Consider Microsoft Sentinel as alternative.' },
  { id: 'bm-3', vendor_name: 'Datadog APM', category: 'Application Performance Monitoring', your_cost_per_seat: 63, market_median: 70, market_low: 55, market_high: 95, peers_count: 31, pricing_percentile: 38, status: 'below_market', recommendation: 'Good pricing. Maintain current agreement.' }
];

// GET /api/savings/summary — aggregated dashboard data (used by frontend CostOptimization)
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    let data = MOCK_SAVINGS;
    if (isSupabaseConfigured()) {
      const { data: rows, error } = await supabase
        .from('savings_opportunities')
        .select('*')
        .eq('user_id', req.user.id);
      if (!error && rows?.length) data = rows;
    }
    const total = data.reduce((a, s) => a + (s.potential_savings || 0), 0);
    res.json({
      success: true,
      data: {
        total_potential_savings: total,
        quick_wins: data.filter(s => s.effort === 'low').length,
        approved: data.filter(s => s.status === 'approved').length,
        opportunities: data.length,
        top_opportunity: [...data].sort((a, b) => b.potential_savings - a.potential_savings)[0] || null,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/savings/opportunities
router.get('/opportunities', authenticateToken, async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('savings_opportunities')
        .select('*')
        .eq('user_id', req.user.id)
        .order('potential_savings', { ascending: false });
      if (error) throw error;
      const total = (data || []).reduce((a, s) => a + (s.potential_savings || 0), 0);
      return res.json({
        success: true,
        data: data || [],
        summary: {
          total_potential: total,
          quick_wins: (data || []).filter(s => s.effort === 'low').length,
          approved: (data || []).filter(s => s.status === 'approved').length
        }
      });
    }
    res.json({
      success: true,
      data: MOCK_SAVINGS,
      summary: {
        total_potential: MOCK_SAVINGS.reduce((a, s) => a + s.potential_savings, 0),
        quick_wins: MOCK_SAVINGS.filter(s => s.effort === 'low').length,
        approved: MOCK_SAVINGS.filter(s => s.status === 'approved').length
      },
      _source: 'mock'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/savings/benchmarks
router.get('/benchmarks', authenticateToken, async (req, res) => {
  res.json({ success: true, data: MOCK_BENCHMARKS });
});

// PATCH /api/savings/opportunities/:id
router.patch('/opportunities/:id', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('savings_opportunities')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .eq('user_id', req.user.id)
        .select()
        .single();
      if (error) throw error;
      return res.json({ success: true, data });
    }
    res.json({ success: true, message: `Opportunity ${req.params.id} updated to ${status} (mock)` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/savings/recalculate
router.post('/recalculate', authenticateToken, async (req, res) => {
  try {
    if (isSupabaseConfigured()) {
      await CostOptimizerService.optimizeAll(req.user.id);
      return res.json({ success: true, message: 'Optimization engine finished scan' });
    }
    res.json({ success: true, message: 'Optimization bypassed (mock)' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
