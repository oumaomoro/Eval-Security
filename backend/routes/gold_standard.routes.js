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

// POST /api/gold-standard/sync - Pre-warm embeddings for seeded clauses
// High-tech utility to ensure RAG is "instant-on" without waiting for first analysis.
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    const { data: missing, error: fetchError } = await supabase
      .from('gold_standard_clauses')
      .select('*')
      .is('embedding', null);

    if (fetchError) throw fetchError;
    if (!missing || missing.length === 0) {
      return res.json({ success: true, message: 'All gold standards are already embedded.' });
    }

    console.log(`[RAG-Sync] Pre-warming ${missing.length} embeddings...`);
    const results = [];

    for (const clause of missing) {
      try {
        const embedding = await generateEmbedding(clause.clause_text);
        const { error: updateError } = await supabase
          .from('gold_standard_clauses')
          .update({ embedding })
          .eq('id', clause.id);

        if (updateError) throw updateError;
        results.push({ id: clause.id, status: 'synced' });
      } catch (err) {
        console.error(`[RAG-Sync] Failed for ${clause.id}:`, err.message);
        results.push({ id: clause.id, status: 'failed', error: err.message });
      }
    }

    return res.json({ success: true, synced: results.filter(r => r.status === 'synced').length, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
