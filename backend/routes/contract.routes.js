import express from 'express';
import multer from 'multer';
import pdf from 'pdf-parse';
import crypto from 'crypto';
import { supabase, orgScopedQuery } from '../services/supabase.service.js';
import { openai } from '../config/openai.js';
import { authenticateToken, requireAnalystOrAdmin, checkContractLimit } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import { logAuditAction } from '../services/audit.service.js';
import { findSimilarGoldStandard } from '../services/vector.service.js';
import { AnalyzerService } from '../services/analyzer.service.js';
import { CostOptimizerService } from '../services/costOptimizer.service.js';
import { z } from 'zod';

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
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

router.post('/analyze', authenticateToken, requireAnalystOrAdmin, upload.single('file'), validate(analyzeSchema), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // ── USAGE-BASED OVERAGE ENFORCEMENT ─────────────────────────────────
    let isOverage = false;
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);
    
    const { count: monthCount } = await supabase
       .from('contracts')
       .select('*', { count: 'exact', head: true })
       .eq('user_id', req.user.id)
       .gte('created_at', startOfMonth.toISOString());
       
    const { data: profile } = await supabase.from('profiles').select('tier').eq('id', req.user.id).single();
    const tier = profile?.tier || 'free';
    
    let limit = 5; 
    if (tier === 'pro') limit = 50;
    if (tier === 'enterprise') limit = 999999;
    
    if ((monthCount || 0) >= limit && tier !== 'enterprise') {
       isOverage = true;
       console.log(`[Overage] User ${req.user.id} exceeded limit of ${limit}. Proceeding with overage charge.`);
    }



    // No explicit clientId needed - scoped by user_id
    
    // Extract text from PDF
    const pdfData = await pdf(req.file.buffer);
    const text = pdfData.text.slice(0, 250000); // Support for full IRA and Cyber Policies (approx 100 pages, well within gpt-4o 128k token context window)

    // 3. Perform Modular Analysis with Innovative Vector Matching (Phase 11.5)
    // The AnalyzerService handles multi-pass extraction and semantic similarity.
    let targetLanguage = 'English';
    let customClauses = [];
    try {
       const { data: ud } = await supabase.auth.admin.getUserById(req.user.id);
       targetLanguage = ud?.user?.user_metadata?.global_profile?.target_language || 'English';
       customClauses = ud?.user?.user_metadata?.custom_clauses || [];
    } catch(err) { console.error('Error fetching global profile language'); }
    
    // Pass target language and user context for custom RAG (Phase 18)
    let analysisResults;
    if (limitCheck.tier === 'enterprise') {
        analysisResults = await AnalyzerService.analyzeDeep(text, { 
           targetLanguage,
           customClauses,
           userId: req.user.id 
        });
    } else {
        analysisResults = await AnalyzerService.analyze(text, { 
           targetLanguage,
           customClauses,
           userId: req.user.id 
        });
    }
    
    let contractInsertData = {
      user_id: req.user.id,
      organization_id: req.user.organization_id || null, // Professional MSP isolation
      ...analysisResults,
      file_url: req.file.originalname,
      status: 'active'
    };

    try {
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .insert([contractInsertData])
        .select()
        .single();
        
      if (contractError) throw contractError;

      if (isOverage) {
        await supabase.from('contract_overages').insert({
          user_id: req.user.id,
          contract_id: contract.id,
          overage_month: startOfMonth.toISOString().split('T')[0],
          price_per_contract: 10.00
        });
      }

      // --- PHASE 27: COST OPTIMIZATION TRIGGER ---
      CostOptimizerService.optimizeContract(contract.id, req.user.id).catch(e => console.error('[CostOptimizer] Async trigger failed:', e.message));

      // Phase 11.3: Log Immutable Analysis Action
      await logAuditAction(req.user.id, contract.id, 'DOCUMENT_UPLOADED_AND_ANALYZED', `Contract ${contract.vendor_name} parsed by RAG engine.`, req);

      // --- PHASE 17: WEBHOOK DISPATCH ---
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(req.user.id);
        const webhookUrl = userData?.user?.user_metadata?.webhook_url;
        
        if (webhookUrl) {
          fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'contract.analyzed',
              contract_id: contract.id,
              vendor_name: contract.vendor_name,
              score: contract.ai_analysis?.compliance_readiness || 0,
              critical_findings: contract.ai_analysis?.categorized_findings?.filter(f => f.severity === 'critical').length || 0,
              timestamp: new Date().toISOString()
            })
          }).catch(e => console.error('[Webhook] Dispatch failed implicitly:', e.message));
          console.log(`[Webhook] Dispatched to ${webhookUrl}`);
        }
      } catch (err) {
        console.error('[Webhook] Setup failed:', err.message);
      }

      return res.json({ success: true, data: contract, message: 'Contract analyzed successfully' });
    } catch (err) {
      console.error('[Contract Error]', err);
      return res.status(500).json({ error: 'Failed to save analysis to database', message: err.message });
    }
    // Replaced entirely above 

  } catch (error) {
    console.error('Analysis error:', error);
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
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json({ success: true, data: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
