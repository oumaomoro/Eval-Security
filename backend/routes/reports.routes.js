import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { supabase } from '../services/supabase.service.js';
import { orgScopedQuery } from '../services/db.utils.js';
import { ReporterService } from '../services/reporter.service.js';
import archiver from 'archiver';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

const REPORT_TEMPLATES = [
  { id: 'tpl-compliance', name: 'Compliance Summary', description: 'Full regulatory compliance status by standard', icon: 'shield' },
  { id: 'tpl-risk', name: 'Risk Executive Brief', description: 'AI-summarized risk landscape for leadership', icon: 'alert' },
  { id: 'tpl-savings', name: 'Cost Optimization', description: 'Savings opportunities ranked by impact', icon: 'dollar' },
  { id: 'tpl-renewal', name: 'Renewal Tracker', description: 'Upcoming renewals with risk and savings flags', icon: 'calendar' },
  { id: 'tpl-vendor', name: 'Vendor Scorecard', description: 'Comprehensive vendor performance ratings', icon: 'star' }
];



// GET /api/reports
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('organization_id', req.user.organization_id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ success: true, data: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reports/evidence-pack
router.post('/evidence-pack', authenticateToken, async (req, res) => {
  try {
    const { standard, type } = req.body;
    
    // 1. Fetch SOC2/ISO Audit trail logs
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('organization_id', req.user.organization_id)
      .order('created_at', { ascending: false })
      .limit(500);

    // 2. Fetch Compliance Drifts
    const { data: drifts } = await supabase
      .from('compliance_drifts')
      .select('*, contract_id(vendor_name), ruleset_id(name)')
      .eq('organization_id', req.user.organization_id)
      .order('created_at', { ascending: false });

    // 3. Compile Evidence Data
    const evidencePayload = {
      standard: standard || 'SOC2 / ISO 27001',
      reportType: type || 'Enterprise Verification',
      timestamp: new Date().toISOString(),
      organization_id: req.user.organization_id,
      generated_by: req.user.email,
      auditTrailCount: auditLogs?.length || 0,
      driftsResolved: drifts?.filter(d => d.alert_generated)?.length || 0,
      evidenceLogs: auditLogs || [],
      driftRegister: drifts || []
    };

    console.log(`[Evidence Pack] Generated ${evidencePayload.auditTrailCount} evidence rows for ${standard}.`);
    
    // Return structured JSON for the frontend to export as CSV or Display
    res.json({ success: true, evidence: evidencePayload });
  } catch (error) {
    console.error('Evidence Pack Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/templates
router.get('/templates', authenticateToken, async (req, res) => {
  res.json({ success: true, data: REPORT_TEMPLATES });
});

// POST /api/reports/generate
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { template_id, name, scope = {} } = req.body;
    
    // 1. Initiate live portfolio synthesis for 'Risk Executive Brief'
    let strategicBrief = "Strategic briefing engine offline.";
    if (template_id === 'tpl-risk') {
      const synthesis = await ReporterService.generateStrategicBrief(req.user.id, req.user);
      strategicBrief = synthesis.brief;
    }

    const newReport = {
      user_id: req.user.id,
      report_name: name || (REPORT_TEMPLATES.find(t => t.id === template_id)?.name || 'Custom Report'),
      report_type: template_id,
      status: 'generating',
      scope,
      generated_by: 'AI Engine v2.1 (Strategic)',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('reports')
      .insert([newReport])
      .select()
      .single();
    if (error) throw error;

    // Logic to actually fill and complete the report
    setTimeout(async () => {
       const { data: contracts } = await orgScopedQuery('contracts', req.user);
       const { data: risks } = await orgScopedQuery('risk_register', req.user);

       await supabase
        .from('reports')
        .update({ 
          status: 'completed', 
          pages: Math.max(5, (contracts?.length || 0)), 
          completed_at: new Date().toISOString(),
          ai_analysis: { 
             strategic_brief: strategicBrief,
             total_portfolio_risk: risks?.length || 0,
             contracts_summarized: contracts?.length || 0
          }
        })
        .eq('id', data.id);
    }, 5000);
    
    return res.json({ success: true, data, message: 'Report generation started.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/reports/export/audit-pack
 * Generates a consolidated ZIP containing original PDFs and full metadata.
 */
router.get('/export/audit-pack', authenticateToken, async (req, res) => {
  try {
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    res.attachment(`Costloci-Audit-Pack-${Date.now()}.zip`);
    archive.pipe(res);

    // 1. Fetch all documents and metadata
    const { data: contracts } = await orgScopedQuery('contracts', req.user);
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('organization_id', req.user.organization_id);

    // 2. Add summary metadata
    archive.append(JSON.stringify({
      organization_id: req.user.organization_id,
      exported_by: req.user.email,
      exported_at: new Date().toISOString(),
      contracts_count: contracts?.length || 0,
      portfolio: contracts?.map(c => ({
        vendor: c.vendor_name,
        service: c.product_service,
        cost: c.annual_cost,
        readiness: c.ai_analysis?.compliance_readiness
      }))
    }, null, 2), { name: 'audit_summary.json' });

    // 3. Add audit trail CSV
    if (auditLogs && auditLogs.length > 0) {
      const csvHeader = 'id,timestamp,action,description\n';
      const csvData = auditLogs.map(l => `"${l.id}","${l.created_at}","${l.action_type}","${l.description}"`).join('\n');
      archive.append(csvHeader + csvData, { name: 'full_audit_history.csv' });
    }

    // 4. Add original PDFs from the uploads directory
    const uploadsPath = join(__dirname, '../uploads');
    
    if (contracts) {
      for (const contract of contracts) {
        if (contract.file_name) {
          const filePath = join(uploadsPath, contract.file_name);
          if (fs.existsSync(filePath)) {
            archive.file(filePath, { name: `documents/${contract.file_name}` });
          }
        }
      }
    }

    await archive.finalize();
  } catch (err) {
    console.error('ZIP Export Error:', err);
    res.status(500).json({ error: 'Failed to generate audit pack.' });
  }
});

/**
 * GET /api/reports/:id/strategic-brief
 * Generates an Enterprise-ready board PDF summary.
 * Starter users require a one-time charge (verified via billing).
 */
/**
 * POST /api/reports/:id/strategic-brief/enqueue
 * Enqueues a Strategic Pack generation job (Background Task)
 */
router.post('/:id/strategic-brief/enqueue', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Initial validation (Tier & Existence)
    const { data: profile } = await supabase.from('profiles').select('tier').eq('id', req.user.id).single();
    if (profile?.tier === 'free') {
       return res.status(403).json({ error: 'Upgrade Required', message: 'Strategic Packs are only available for Starter+ members.' });
    }

    const { data: report } = await supabase.from('reports').select('*').eq('id', id).single();
    if (!report) return res.status(404).json({ error: 'Report not found' });

    // 2. Register Background Job
    const { data: job, error: jobError } = await supabase
      .from('background_jobs')
      .insert({
        user_id: req.user.id,
        job_type: 'strategic_pack_generation',
        status: 'queued',
        payload: { report_id: id, report_name: report.report_name }
      })
      .select('id')
      .single();

    if (jobError) throw jobError;

    // 3. Real Background Processing — Generate PDF & upload to Supabase Storage
    setImmediate(async () => {
      try {
        await supabase.from('background_jobs').update({ status: 'processing' }).eq('id', job.id);

        // Pull live data for the pack
        const { data: contracts } = await orgScopedQuery('contracts', req.user);
        const { data: risks } = await orgScopedQuery('risk_register', req.user);

        // Generate the Strategic PDF
        const pdfDoc = new PDFDocument({ margin: 50, size: 'A4' });
        const fileName = `strategic-pack-${job.id}.pdf`;
        const tmpPath = join(__dirname, '../uploads', fileName);
        const writeStream = fs.createWriteStream(tmpPath);
        pdfDoc.pipe(writeStream);

        // ── PDF Content ───────────────────────────────────────────────────
        pdfDoc.rect(0, 0, 600, 90).fill('#0f172a');
        pdfDoc.fillColor('#ffffff').fontSize(22).text('COSTLOCI', 50, 28, { characterSpacing: 2 });
        pdfDoc.fontSize(10).text('Enterprise Strategic Intelligence Pack', 50, 58);
        pdfDoc.moveDown(4);
        pdfDoc.fillColor('#1e293b').fontSize(16).text(`Strategic Pack: ${report.report_name}`, 50, 110);
        pdfDoc.fontSize(10).fillColor('#64748b').text(`Generated: ${new Date().toLocaleDateString()} · Organization: ${req.user.organization_id || req.user.id}`, 50, 132);
        pdfDoc.moveTo(50, 150).lineTo(550, 150).stroke('#e2e8f0');

        pdfDoc.moveDown(2);
        pdfDoc.fillColor('#0f172a').fontSize(13).text('Portfolio Summary', 50);
        pdfDoc.fontSize(10).fillColor('#475569').text(`Total Contracts Analyzed: ${contracts?.length || 0}`, 50);
        pdfDoc.text(`Total Identified Risks: ${risks?.length || 0}`, 50);

        if (contracts && contracts.length > 0) {
          pdfDoc.moveDown(1);
          pdfDoc.fillColor('#0f172a').fontSize(12).text('Contract Portfolio');
          contracts.slice(0, 20).forEach((c, i) => {
            pdfDoc.fontSize(9).fillColor('#334155')
              .text(`${i + 1}. ${c.vendor_name || 'Unknown'} — $${(c.annual_cost || 0).toLocaleString()}/yr — Compliance: ${c.ai_analysis?.compliance_readiness || 'N/A'}%`, 60);
          });
        }

        pdfDoc.fontSize(8).fillColor('#94a3b8').text('Confidential. For internal use only. Generated by Costloci Enterprise.', 50, 760, { align: 'center' });
        pdfDoc.end();
        // ─────────────────────────────────────────────────────────────────

        await new Promise((resolve, reject) => {
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });

        // Upload to Supabase Storage
        const fileBuffer = fs.readFileSync(tmpPath);
        const storagePath = `${req.user.organization_id || req.user.id}/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from('reports')
          .upload(storagePath, fileBuffer, { contentType: 'application/pdf', upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('reports').getPublicUrl(storagePath);
        fs.unlinkSync(tmpPath);

        await supabase.from('background_jobs').update({
          status: 'completed',
          result: { file_url: publicUrl },
          updated_at: new Date().toISOString()
        }).eq('id', job.id);

      } catch (procError) {
        console.error('[reports/enqueue] PDF generation failed:', procError.message);
        await supabase.from('background_jobs').update({
          status: 'failed',
          error: procError.message
        }).eq('id', job.id);
      }
    });

    res.json({ success: true, jobId: job.id, message: 'Strategic Pack generation enqueued.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/reports/jobs/:jobId/status
 * Polling endpoint for background processing status
 */
router.get('/jobs/:jobId/status', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { data: job, error } = await supabase
      .from('background_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', req.user.id)
      .single();

    if (error || !job) return res.status(404).json({ error: 'Job not found' });
    res.json({ success: true, job });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
