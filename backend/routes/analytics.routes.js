import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { supabase } from '../services/supabase.service.js';
import { orgScopedQuery } from '../services/db.utils.js';
import { ROIService } from '../services/roi.service.js';

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
      if (error) {
        if (error.message.includes('relation "risk_register" does not exist')) {
          console.warn('[analytics] risk_register table missing');
        } else {
          throw error;
        }
      }
      risks = data || [];
    } catch (e) { console.warn('[analytics] risk_register fetch skipped due to error'); }

    // Heatmap Aggregation (count failed compliance areas)
    const totalContracts = contracts.length;
    const riskHeatmap = {
      'Data Privacy (GDPR/KDPA)': 0,
      'Security (ISO27001)': 0,
      'Regulatory (IRA/CMA)': 0,
      'Financial (Liability)': 0,
      'Operational (SLA)': 0
    };

    let totalFinancialExposure = 0;
    let avgComplianceScore = 0;
    let sectorBenchmark = 75; // Industry average baseline

    // Executive ROI Calculation (Phase 16: Enterprise ROIService)
    const { data: profile } = await supabase.from('profiles').select('tier').eq('id', req.user.id).single();
    const tier = profile?.tier || 'free';

    const roiMetrics = ROIService.calculateEconomicImpact(contracts, risks, tier);
    const totalEconomicImpact = roiMetrics.total_impact;

    if (totalContracts > 0) {
      const totalScore = contracts.reduce((acc, c) => acc + (c.ai_analysis?.compliance_readiness || 0), 0);
      avgComplianceScore = Math.round(totalScore / totalContracts);
    }

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
        executive_roi: {
          total_economic_impact: totalEconomicImpact,
          efficiency_savings: roiMetrics.efficiency_savings,
          risk_mitigation_value: roiMetrics.risk_mitigation_value,
          hours_liberated: roiMetrics.hours_saved,
          roi_ratio: roiMetrics.roi_ratio,
          board_summary: `Your portfolio of ${totalContracts} contracts has a compliance health of ${avgComplianceScore}%. By automating analysis, you've realized $${totalEconomicImpact.toLocaleString()} in economic impact.`
        },
        compliance_health: {
          current_score: avgComplianceScore,
          benchmark: sectorBenchmark,
          delta: avgComplianceScore - sectorBenchmark
        },
        risk_heatmap: riskHeatmap,
        total_mitigated_exposure: totalFinancialExposure,
        contracts_analyzed: totalContracts
      }
    });
  } catch (error) {
    console.error('Analytics Fetch Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/analytics/roi-deep-dive - Returns detailed benchmark delta
router.get('/roi-deep-dive', authenticateToken, async (req, res) => {
  try {
    const { data: contracts } = await orgScopedQuery('contracts', req.user);
    if (!contracts) return res.json({ success: true, deltas: [] });

    const deltas = contracts.map(c => {
      const benchmark = ROIService.getSectorBenchmarks(c.detected_sector, c.detected_jurisdiction);
      return {
        id: c.id,
        vendor: c.vendor_name,
        annual_cost: c.annual_cost,
        market_average: benchmark.avg_annual_cost,
        delta: c.annual_cost - benchmark.avg_annual_cost,
        compliance_score: c.ai_analysis?.compliance_readiness || 0,
        compliance_target: benchmark.compliance_target
      };
    });

    res.json({ success: true, data: deltas });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
