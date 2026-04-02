import { supabase, isSupabaseConfigured } from './supabase.service.js';

export const StartupService = {
    async runPreFlightChecks() {
        console.log('\n🚀 [Startup] Running Autodevelop Pre-flight Checks...');
        const issues = [];

        // 1. Env Check
        const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'OPENAI_API_KEY', 'JWT_SECRET'];
        required.forEach(key => {
            if (!process.env[key]) issues.push(`Missing Environment Variable: ${key}`);
        });

        if (!isSupabaseConfigured()) {
            issues.push('Supabase is not configured. Database features will fail.');
        } else {
            // 2. DB RPC Check (Migration Runner Prerequisite)
            try {
                const { error } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1' });
                if (error && error.message.includes('function "exec_sql" does not exist')) {
                    issues.push('CRITICAL: Supabase RPC "exec_sql" is missing. Automated migrations will FAIL.');
                } else if (error) {
                    console.warn('[Startup] exec_sql check warning:', error.message);
                } else {
                    console.log('✅ DB Migration Runner (exec_sql) is active.');
                }
            } catch (e) {
                console.warn('[Startup] Could not verify RPC function.');
            }

            // 3. Storage Bucket Check & Autofix
            try {
                const { data: buckets } = await supabase.storage.listBuckets();
                const hasContracts = buckets?.find(b => b.name === 'contracts');
                if (!hasContracts) {
                    console.log('📡 [Autofix] Storage Bucket "contracts" missing. Creating...');
                    await supabase.storage.createBucket('contracts', { public: true });
                    console.log('✅ [Autofix] Storage Bucket "contracts" created.');
                } else {
                    console.log('✅ Storage Bucket "contracts" verified.');
                }
            } catch (e) {
                console.warn('[Startup] Bucket check skipped.');
            }

            // 4. Core Table Check
            const coreTables = ['profiles', 'contracts', 'clients', 'gold_standard_clauses'];
            for (const table of coreTables) {
                const { error: tError } = await supabase.from(table).select('id').limit(1);
                if (tError && tError.message.includes('does not exist')) {
                    issues.push(`CRITICAL: Table "public.${table}" is missing. Run the Master Patch.`);
                }
            }
        }

        if (issues.length > 0) {
            console.error('\n⚠️  [Startup] FOUND INFRASTRUCTURE ISSUES:');
            issues.forEach(issue => console.error(`   - ${issue}`));
            console.log('\n💡 Resolution: Check your .env file or run the SQL Master Patch in Supabase.\n');
        } else {
            console.log('✨ [Startup] All systems green. Production ready.\n');
        }

        return issues;
    }
};
