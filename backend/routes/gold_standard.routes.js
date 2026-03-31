import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { supabase, isSupabaseConfigured } from '../services/supabase.service.js';
import { generateEmbedding } from '../services/vector.service.js';

const router = express.Router();

// GET /api/gold-standard - List available standards
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('gold_standard_clauses')
      .select('id, standard_name, clause_category, created_at')
      .order('standard_name', { ascending: true });
    if (error) throw error;
    return res.json({ success: true, data: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/gold-standard - Add a single gold standard clause
// (In a real app, this would be part of a larger document upload process)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { standard_name, clause_category, clause_text } = req.body;
    
    if (!standard_name || !clause_category || !clause_text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const embedding = await generateEmbedding(clause_text);

    const { data, error } = await supabase
      .from('gold_standard_clauses')
      .insert([{
        standard_name,
        clause_category,
        clause_text,
        embedding
      }])
      .select()
      .single();
    
    if (error) throw error;
    return res.json({ success: true, data, message: 'Gold Standard clause added with embedding.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
