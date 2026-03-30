import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { supabase, orgScopedQuery } from '../services/supabase.service.js';

const router = express.Router();

/**
 * GET /api/analytics/dashboard
 * Aggregates and returns ROI, Risk Heatmaps, and Time Saves for the Command Center.
 */
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    let contracts = [];
    let risks = [];

    // Individual try-catches for robustness against uninitialized tables
    try {
      const { data, error } = await orgScopedQuery('contracts', req.user);
      if (!error) contracts = data || [];
    } catch (e) { console.warn('[analytics] contracts fetch skipped'); }

    try {
      const { data, error } = await orgScopedQuery('risk_register', req.user);
      if (!error) risks = data || [];
    } catch (e) { console.warn('[analytics] risk_register fetch skipped'); }

    const totalContracts = contracts.length;
    
    // Predictive ROI Calculation (assuming 2.5 hours saved per review, at $350/hour internal legal rate)
    const hoursSaved = totalContracts * 2.5;
    const costSavings = hoursSaved * 350;

    // Heatmap Aggregation (count failed compliance areas)
    const riskHeatmap = {
      'Data Privacy (GDPR/KDPA)': 0,
      'Security (ISO27001)': 0,
      'Regulatory (IRA/CMA)': 0,
      'Financial (Liability)': 0,
      'Operational (SLA)': 0
    };

    let totalFinancialExposure = 0;

    risks.forEach(risk => {
       if (risk.severity === 'critical' || risk.severity === 'high') {
          if (risk.risk_category === 'privacy' || risk.risk_category === 'compliance') riskHeatmap['Data Privacy (GDPR/KDPA)']++;
          else if (risk.risk_category === 'security') riskHeatmap['Security (ISO27001)']++;
          else if (risk.risk_category === 'strategic' || risk.risk_category === 'compliance') riskHeatmap['Regulatory (IRA/CMA)']++;
          else if (risk.risk_category === 'financial') riskHeatmap['Financial (Liability)']++;
          else riskHeatmap['Operational (SLA)']++;
          
          if (risk.financial_exposure && typeof risk.financial_exposure === 'object') {
             totalFinancialExposure += (risk.financial_exposure.max_estimate || 0);
          }
       }
    });

    res.json({
      success: true,
      data: {
        predictive_roi: {
          contracts_analyzed: totalContracts,
          hours_saved: hoursSaved,
          cost_savings_usd: costSavings,
        },
        risk_heatmap: riskHeatmap,
        total_mitigated_exposure: totalFinancialExposure
      }
    });
  } catch (error) {
    console.error('Analytics Fetch Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
