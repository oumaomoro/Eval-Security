import express from 'express';
import multer from 'multer';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import crypto from 'crypto';
import { supabase } from '../services/supabase.service.js';
import { orgScopedQuery } from '../services/db.utils.js';
import { openai } from '../config/openai.js';
import { authenticateToken, requireAnalystOrAdmin, checkContractLimit } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { logAuditAction } from '../services/audit.service.js';
import { findSimilarGoldStandard } from '../services/vector.service.js';
import { AnalyzerService } from '../services/analyzer.service.js';
import { CostOptimizerService } from '../services/costOptimizer.service.js';
import { z } from 'zod';
import fs from 'fs';
import { join } from 'path';

const router = express.Router();

const analyzeSchema = z.object({
  // No required fields other than the file itself, which multer handles
});

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 }, // default 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Only PDF and DOCX are allowed.`), false);
    }
  }
});

router.post('/analyze', authenticateToken, upload.array('files', 10), async (req, res) => {
  try {
    // ── FILE NORMALIZATION ────────────────────────────────────────────────
    const files = req.files || (req.file ? [req.file] : []);
    if (files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

    const { data: profile } = await supabase.from('profiles').select('tier').eq('id', req.user.id).single();
    const tier = profile?.tier || 'free';

    // ── BATCH EXECUTION ──────────────────────────────────────────────────
    const uploadsDir = join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const analysisPromises = files.map(async (file) => {
      try {
        // Save file to disk for "Audit Pack" and static serving
        const fileExt = file.originalname.split('.').pop();
        const safeName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = join(uploadsDir, safeName);
        fs.writeFileSync(filePath, file.buffer);

        let text = '';
        if (file.mimetype === 'application/pdf') {
          const pdfData = await pdf(file.buffer);
          text = pdfData.text.slice(0, 250000);
        } else if (file.originalname.endsWith('.docx') || file.mimetype.includes('word')) {
          const result = await mammoth.extractRawText({ buffer: file.buffer });
          text = result.value.slice(0, 250000);
        } else {
           throw new Error('Unsupported processing format');
        }

        const results = (tier === 'enterprise')
          ? await AnalyzerService.analyzeDeep(text, { userId: req.user.id, organizationId: req.user.organization_id })
          : await AnalyzerService.analyze(text, { userId: req.user.id, organizationId: req.user.organization_id });

        const { data: contract, error: contractError } = await supabase
          .from('contracts')
          .insert([{
            user_id: req.user.id,
            organization_id: req.user.organization_id,
            client_id: req.body.clientId || null,
            ...results,
            file_name: safeName, // Store the SAFE UUID-based name
            status: 'active'
          }])
          .select()
          .single();

        if (contractError) throw contractError;

        // Async triggers
        CostOptimizerService.optimizeContract(contract.id, req.user.id).catch(() => { });
        logAuditAction(req.user.id, contract.id, 'BATCH_UPLOAD', `Contract ${contract.vendor_name} analyzed.`, req).catch(() => { });

        return { success: true, fileName: file.originalname, id: contract.id };
      } catch (err) {
        console.error(`[Batch] Failed to analyze ${file.originalname}:`, err.message);
        return { success: false, fileName: file.originalname, error: err.message };
      }
    });

    const results = await Promise.all(analysisPromises);
    const successCount = results.filter(r => r.success).length;

    res.json({
      success: true,
      count: successCount,
      total: files.length,
      results
    });

  } catch (error) {
    console.error('Batch analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {


    // Professional Data Siloing: Scoped by organization_id
    try {
      const query = orgScopedQuery('contracts', req.user);
      const { data: contracts, error } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.json({ success: true, data: contracts || [], count: contracts?.length || 0 });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch contracts', message: err.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Phase 11.3: GET Immutable Chain of Custody Audit Trail for a specific contract
router.get('/:id/audit', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('contract_id', req.params.id)
      .eq('organization_id', req.user.organization_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json({ success: true, data: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
