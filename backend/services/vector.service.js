import { openai } from '../config/openai.js';
import { supabase } from './supabase.service.js';

/**
 * Enhanced Vector Service: Global, Modular and Context-Aware
 */
export async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text.replace(/\n/g, ' '),
    });
    return response.data[0].embedding;
  } catch (err) {
    console.error('Embedding failed:', err);
    throw err;
  }
}

/**
 * Finds similar gold standard clauses with contextual filtering.
 * Implementing professional, innovative global filtering (Sector & Jurisdiction).
 */
export async function findSimilarGoldStandard(text, category = null, sector = 'general', jurisdiction = 'global') {
  try {
    const embedding = await generateEmbedding(text);
    
    // Call the Supabase RPC match_clauses with improved filters
    const { data, error } = await supabase.rpc('match_clauses', {
      query_embedding: embedding,
      match_threshold: 0.6,
      match_count: 5,
      category_filter: category,
      sector_filter: sector,
      jurisdiction_filter: jurisdiction
    });

    if (error) throw error;
    
    // Innovation: Prefer Exact Jurisdiction Match, then fallback to Global
    return data && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error('Vector similarity search failed:', err);
    return null;
  }
}
