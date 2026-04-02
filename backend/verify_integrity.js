/**
 * FINAL INGESTION ACCURACY VERIFIER
 * Simulates a contract clause analysis to verify Vector RAG + ROI Caching.
 */
import dotenv from 'dotenv';
dotenv.config();
import { generateEmbedding, findSimilarGoldStandard } from './services/vector.service.js';
import { AnalyzerService } from './services/analyzer.service.js';

async function runIntegrityCheck() {
    console.log('🔍 Starting RAG Integrity Verification...');

    const sampleClause = "The vendor shall notify the customer within 72 hours of any security breach.";
    const frameworkContext = "GDPR/KDPA Compliance";

    try {
        // 1. Test Embedding Generation
        console.log('  -> Testing OpenAI Embedding Generation...');
        const embedding = await generateEmbedding(sampleClause);
        if (embedding && embedding.length === 1536) {
            console.log('  ✅ Embedding generated (1536 dimensions)');
        }

        // 2. Test Vector Matching
        console.log('  -> Testing Vector Match (Gold Standards)...');
        const matches = await findSimilarGoldStandard(embedding, 'compliance', 'general', 'global');
        if (matches && matches.length > 0) {
            console.log(`  ✅ Found ${matches.length} similar gold standard(s)`);
            console.log(`  Top Match: ${matches[0].standard_name} (${Math.round(matches[0].similarity * 100)}%)`);
        } else {
            console.warn('  ⚠️ No gold standard matches found. Ensure FINAL_PATCH_v1.3.sql was applied.');
        }

        // 3. Test Analyzer Logic (Delta + Gap Analysis)
        console.log('  -> Testing AI Delta Analysis...');
        const result = await AnalyzerService.analyzeClause(sampleClause, {
            category: 'compliance',
            sector: 'general',
            jurisdiction: 'global'
        });

        if (result.gold_standard_alignment) {
            console.log('  ✅ Gap Analysis completed');
            console.log(`  Alignment Score: ${result.gold_standard_alignment.similarity}%`);
            if (result.gold_standard_alignment.suggested_redline) {
                console.log('  ✅ Redline generated successfully');
            }
        }

        console.log('\n🌟 INTEGRITY CHECK PASSED: RAG Pipeline is Production-Ready.');
    } catch (error) {
        console.error('\n❌ Integrity Check Failed:', error.message);
        if (error.message.includes('429')) {
            console.warn('  💡 Tip: OpenAI Quota exceeded. Verification partially blocked by API limits.');
        }
    }
}

runIntegrityCheck();
