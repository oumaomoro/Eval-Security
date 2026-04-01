import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { AnalyzerService } from '../services/analyzer.service.js';

const router = express.Router();

router.post('/analyze-clause', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.length < 20) {
      return res.status(400).json({ error: 'Text too short for analysis.' });
    }

    console.log('[Word Add-in] Analyzing snippet for risk...');

    // We can use the existing analyzer service. Since it's just a snippet,
    // we might just run analyzeDeep or a special prompt.
    // The AnalyzerService returns an object with `categorized_findings`.
    const analysisResponse = await AnalyzerService.analyze(text, { targetLanguage: 'English' });
    
    // Map the main contract analysis to the format WordTaskpane expects.
    // WordTaskpane expects: { findings: [ { title, description, severity, suggested_redline } ] }
    let findings = [];
    if (analysisResponse.categorized_findings) {
        findings = analysisResponse.categorized_findings.map(f => ({
            title: f.title || f.issue,
            description: f.description || f.implication,
            severity: f.severity || 'warning',
            suggested_redline: f.suggested_redline || f.recommendation || null
        }));
    }

    // fallback if no categorized findings
    if (findings.length === 0) {
        findings.push({
            title: "Analysis Completed",
            description: "No critical risks found in this specific clause. Ensure it aligns with your corporate playbook.",
            severity: "info",
            suggested_redline: null
        });
    }

    res.json({ success: true, findings });
    
  } catch (error) {
    console.error('[Word Add-in API] Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
