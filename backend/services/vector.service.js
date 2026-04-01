import { openai } from '../config/openai.js';
import { supabase } from './supabase.service.js';

/**
 * Resilience Wrapper: Exponential Backoff for transient AI failures.
 * High ROI: Prevents vector search failures due to OpenAI rate limits.
 */
async function _withRetry(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const isRateLimit = err.status === 429 || err.message?.includes('rate_limit');
      if (i === retries - 1 || !(isRateLimit || err.status >= 500)) throw err;
      console.warn(`[Vector Retry ${i+1}/${retries}] Pausing for ${delay}ms after:`, err.message);
      await new Promise(r => setTimeout(r, delay));
      delay *= 2;
    }
  }
}

/**
 * Enhanced Vector Service: Global, Modular and Context-Aware
 */
export async function generateEmbedding(text) {
  try {
    const response = await _withRetry(() => openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text.replace(/\n/g, ' '),
    }));
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
    
    // Call the Supabase RPC match_clauses with improved filters (Phase 18 Hardening)
    const { data, error } = await supabase.rpc('match_clauses', {
      query_embedding: embedding,
      match_threshold: 0.6,
      match_count: 5,
      category_filter: category,
      sector_filter: sector,
      jurisdiction_filter: jurisdiction
    });

    if (error) throw error;
    
    // SQL handles sorting (Exact Jurisdiction match first), so we return the best match
    return data && data.length > 0 ? data[0] : null;
  } catch (err) {
    console.error('Vector similarity search failed:', err);
    return null;
  }
}
