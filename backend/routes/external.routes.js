import express from 'express';
import multer from 'multer';
import pdf from 'pdf-parse';
import { supabase } from '../services/supabase.service.js';
import { AnalyzerService } from '../services/analyzer.service.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 100, // max 100 requests per window per IP/Key
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

router.post('/analyze', apiLimiter, upload.single('file'), async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const token = authHeader.split(' ')[1];

    // Secure Lookup Logic: Identify the user associated with the token
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, api_key, api_key_hashed, api_access, tier, role')
      .not('api_key', 'is', null);

    if (error || !profiles) {
      return res.status(401).json({ error: 'System busy, please try again later.' });
    }

    let profile = null;
    for (const p of profiles) {
       if (p.api_key_hashed) {
          // Robust comparison against the secure hash
          const match = await bcrypt.compare(token, p.api_key);
          if (match) { 
            profile = p;
            break;
          }
       } else if (p.api_key === token) {
          // Legacy support for un-rotated keys
          profile = p;
          break;
       }
    }

    if (!profile || !profile.api_access) {
      return res.status(401).json({ error: 'Invalid API key or API access not enabled' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Extract text
    const pdfData = await pdf(req.file.buffer);
    const text = pdfData.text.slice(0, 250000);

    // Get user preferences
    let targetLanguage = 'English';
    let customClauses = [];
    try {
      const { data: ud } = await supabase.auth.admin.getUserById(profile.id);
      targetLanguage = ud?.user?.user_metadata?.global_profile?.target_language || 'English';
      customClauses = ud?.user?.user_metadata?.custom_clauses || [];
    } catch(err) {
      // Ignore
    }

    // Always use deep analysis for API tier
    const analysisResults = await AnalyzerService.analyzeDeep(text, { 
       targetLanguage,
       customClauses,
       userId: profile.id 
    });

    const clientId = req.body.client_id || null;

    const contractInsertData = {
      user_id: profile.id,
      organization_id: clientId,
      ...analysisResults,
      file_url: req.file.originalname,
      status: 'active'
    };

    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .insert([contractInsertData])
      .select()
      .single();

    if (contractError) throw contractError;

    res.json({ success: true, analysis: analysisResults, contractId: contract.id });

  } catch (error) {
    console.error('External API Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
