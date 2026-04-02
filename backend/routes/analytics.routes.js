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
      if (error) {
        if (error.message.includes('relation "risk_register" does not exist')) {
          console.warn('[analytics] risk_register table missing');
        } else {
          throw error;
        }
      }
      risks = data || [];
    } catch (e) { console.warn('[analytics] risk_register fetch skipped due to error'); }

    // Executive ROI Calculation (Higher Accuracy)
    // 1. Efficiency: 2.5 hours saved per review at $350/hour internal legal rate
    // 2. Risk Mitigation: $2,500 average avoided data breach penalty/legal cost per identified gap
    const hoursSaved = totalContracts * 2.5;
    const efficiencySavings = hoursSaved * 350;

    let totalIdentifiedGaps = 0;
    contracts.forEach(c => {
      totalIdentifiedGaps += (c.ai_analysis?.categorized_findings?.length || 0);
    });
    const riskMitigationValue = totalIdentifiedGaps * 2500;

    // Heatmap Aggregation (count failed compliance areas)
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
          total_economic_impact: efficiencySavings + riskMitigationValue,
          efficiency_savings: efficiencySavings,
          risk_mitigation_value: riskMitigationValue,
          hours_liberated: hoursSaved
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

export default router;
