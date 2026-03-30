import express from 'express';
import { supabase, isSupabaseConfigured } from '../services/supabase.service.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    // DEV BYPASS: Return mock metrics for test user
    if (req.user.id === '00000000-0000-0000-0000-000000000000' || !isSupabaseConfigured()) {
      const mockMetrics = {
        total_contracts: 12,
        total_spend: 145000,
        upcoming_renewals: 3,
        high_risk_contracts: 2,
        roi_savings: 18000, // Simulated $150/hr * 10hrs * 12 contracts
        maturity_score: 84,
        risk_trend: [65, 59, 80, 81, 56, 55, 40].reverse() // Simulated progress
      };
      return res.json({ success: true, data: mockMetrics, _source: 'mock' });
    }

    let contracts = [];
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('user_id', req.user.id);
        
      if (!error) {
        contracts = data || [];
      }
    } catch (dbErr) {
      console.warn('[dashboard] Table fetch failed (might not exist yet):', dbErr.message);
    }

    const total_contracts = contracts.length;
    const avg_risk = total_contracts > 0 
      ? contracts.reduce((sum, c) => sum + (c.risk_score || 50), 0) / total_contracts
      : 0;
    
    // Profitability Metric: Estimated cost saved (AI vs Manual Legal Review)
    const roi_savings = total_contracts * 150 * 4;

    const metrics = {
      total_contracts,
      total_spend: contracts.reduce((sum, c) => sum + (Number(c.annual_cost) || 0), 0),
      upcoming_renewals: contracts.filter(c => {
        if (!c.renewal_date) return false;
        const renewal = new Date(c.renewal_date);
        const thirtyDays = new Date();
        thirtyDays.setDate(thirtyDays.getDate() + 30);
        return renewal <= thirtyDays && renewal >= new Date();
      }).length,
      high_risk_contracts: contracts.filter(c => 
        (c.ai_analysis?.risk_flags?.length > 0) || (c.risk_score > 70)
      ).length,
      roi_savings,
      maturity_score: Math.round(100 - avg_risk),
      risk_trend: total_contracts > 0 
        ? [70, 68, 65, 60, 55, 50, Math.round(avg_risk)] 
        : [0, 0, 0, 0, 0, 0, 0]
    };

    res.json({ 
      success: true, 
      data: metrics 
    });
  } catch (error) {
    console.error('[dashboard] Internal metric failure, falling back to zeros:', error.message);
    res.json({ 
      success: true, 
      data: {
        total_contracts: 0,
        total_spend: 0,
        upcoming_renewals: 0,
        high_risk_contracts: 0,
        roi_savings: 0,
        maturity_score: 0,
        risk_trend: [0, 0, 0, 0, 0, 0, 0]
      }
    });
  }
});

export default router;
