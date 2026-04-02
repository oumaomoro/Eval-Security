/**
 * AUTOMATED SUPABASE MIGRATION RUNNER
 * Low-cost, high-tech: Applies SQL migrations directly via the Supabase 
 * PostgREST / RPC interface using the Service Role Key.
 * No manual SQL editor required going forward.
 */
import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration(filePath) {
    console.log(`\n🚀 Applying Migration: ${path.basename(filePath)}...`);
    const sql = fs.readFileSync(filePath, 'utf8');

    // Use the 'exec_sql' RPC (requires it to be defined in Supabase first)
    // If not defined, we'll try a fallback or guide the user.
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        if (error.message.includes('function "exec_sql" does not exist')) {
            console.error('❌ Error: Remote RPC "exec_sql" not found.');
            console.log('\n=============================================================');
            console.log('  ONE-TIME MANUAL STEP:');
            console.log('  Please run this in your Supabase SQL Editor once:');
            console.log('-------------------------------------------------------------');
            console.log('  CREATE OR REPLACE FUNCTION exec_sql(sql_query text)');
            console.log('  RETURNS void AS $$');
            console.log('  BEGIN EXECUTE sql_query; END;');
            console.log('  $$ LANGUAGE plpgsql SECURITY DEFINER;');
            console.log('=============================================================\n');
        } else {
            console.error('❌ Migration failed:', error.message);
        }
        return false;
    }

    console.log('✅ Migration applied successfully.');

    // Autofix: Reload schema cache to prevent "Could not find table in schema cache" errors
    console.log('📡 Reloading Supabase schema cache...');
    await supabase.rpc('exec_sql', { sql_query: "NOTIFY pgrst, 'reload schema';" }).catch(e => {
        console.warn('⚠️ Schema reload notification failed (normal if pgrst is not listening):', e.message);
    });

    return true;
}

import { generateEmbedding } from './services/vector.service.js';

async function autoPreWarm() {
    console.log('\n🧠 Auto-Fix: Checking for missing RAG embeddings...');
    try {
        const { data: missing, error } = await supabase
            .from('gold_standard_clauses')
            .select('id, clause_text')
            .is('embedding', null);

        if (error) throw error;
        if (!missing || missing.length === 0) {
            console.log('✅ All RAG clauses are already embedded.');
            return;
        }

        console.log(`📡 Found ${missing.length} clauses needing embeddings. Generating...`);
        for (const item of missing) {
            const embedding = await generateEmbedding(item.clause_text);
            await supabase
                .from('gold_standard_clauses')
                .update({ embedding })
                .eq('id', item.id);
            console.log(`  ✓ Embedded: ${item.id}`);
        }
        console.log('🚀 RAG Pre-warming complete.');
    } catch (err) {
        console.error('⚠️ Auto-fix failed:', err.message);
    }
}

const migrationFile = path.resolve('..', 'database', 'migrations', 'FINAL_PATCH_v1.3.sql');

async function start() {
    if (fs.existsSync(migrationFile)) {
        const success = await runMigration(migrationFile);
        if (success) {
            await autoPreWarm();
        }
    } else {
        console.error(`❌ Migration file not found: ${migrationFile}`);
    }
}

start().catch(console.error);
