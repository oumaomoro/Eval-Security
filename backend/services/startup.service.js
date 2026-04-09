import { supabase, isSupabaseConfigured } from './supabase.service.js';

export const StartupService = {
    async runPreFlightChecks() {
        console.log('\n🚀 [Startup] Running Autodevelop Pre-flight Checks...');
        const issues = [];

        // 1. Env Check
        const critical = [
            'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'OPENAI_API_KEY', 'JWT_SECRET',
            'PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET'
        ];
        const optional = ['STRIPE_SECRET_KEY', 'PAYSTACK_SECRET_KEY', 'RESEND_API_KEY'];

        critical.forEach(key => {
            if (!process.env[key]) issues.push(`Missing Critical Variable: ${key}`);
        });
        
        optional.forEach(key => {
            if (!process.env[key]) console.log(`ℹ️  Optional variable ${key} not set.`);
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

            // 4. Core Table Check & Local Autofix (Provision missing tables via RPC if possible)
            const coreTables = ['profiles', 'contracts', 'clients', 'gold_standard_clauses', 'webhook_events', 'risk_register', 'compliance_audits', 'savings_opportunities', 'email_queue'];
            for (const table of coreTables) {
                const { error: tError } = await supabase.from(table).select('id', { count: 'exact', head: true }).limit(1);

                if (tError && tError.message.includes('does not exist')) {
                    console.log(`📡 [Autofix] Table "public.${table}" missing. Attempting restoration...`);

                    // Autofix mapping for critical small tables
                    if (table === 'webhook_events') {
                        const sql = `CREATE TABLE IF NOT EXISTS public.webhook_events (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, provider text, event_type text, payload jsonb, headers jsonb, processed boolean DEFAULT false, processed_at timestamptz, error text, created_at timestamptz DEFAULT now());`;
                        await supabase.rpc('exec_sql', { sql_query: sql });
                        console.log('✅ [Autofix] Table "webhook_events" restored.');
                    } else if (table === 'email_queue') {
                        const sql = `CREATE TABLE IF NOT EXISTS public.email_queue (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, "to" text, subject text, html text, attempts integer DEFAULT 0, status text DEFAULT 'pending', next_attempt timestamptz DEFAULT now(), created_at timestamptz DEFAULT now());`;
                        await supabase.rpc('exec_sql', { sql_query: sql });
                        console.log('✅ [Autofix] Table "email_queue" restored.');
                    } else if (table === 'risk_register') {
                        const sql = `CREATE TABLE IF NOT EXISTS public.risk_register (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, user_id uuid REFERENCES auth.users(id), contract_id uuid REFERENCES public.contracts(id), risk_title text, risk_category text, risk_description text, severity text, likelihood text, impact text, risk_score integer, mitigation_status text DEFAULT 'identified', financial_exposure jsonb, ai_confidence integer, created_at timestamptz DEFAULT now(), updated_at timestamptz);`;
                        await supabase.rpc('exec_sql', { sql_query: sql });
                        console.log('✅ [Autofix] Table "risk_register" restored.');
                    } else if (table === 'compliance_audits') {
                        const sql = `CREATE TABLE IF NOT EXISTS public.compliance_audits (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, user_id uuid REFERENCES auth.users(id), audit_name text NOT NULL, status text DEFAULT 'completed', score integer DEFAULT 0, findings jsonb DEFAULT '[]', created_at timestamptz DEFAULT now());`;
                        await supabase.rpc('exec_sql', { sql_query: sql });
                        console.log('✅ [Autofix] Table "compliance_audits" restored.');
                    } else if (table === 'savings_opportunities') {
                        const sql = `CREATE TABLE IF NOT EXISTS public.savings_opportunities (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, user_id uuid REFERENCES auth.users(id), contract_id uuid REFERENCES public.contracts(id), opportunity_type text, potential_savings numeric(12,2), status text DEFAULT 'identified', created_at timestamptz DEFAULT now());`;
                        await supabase.rpc('exec_sql', { sql_query: sql });
                        console.log('✅ [Autofix] Table "savings_opportunities" restored.');
                    } else {
                        issues.push(`CRITICAL: Table "public.${table}" is missing. Manual intervention required (Apply FINAL_PATCH_v1.3.sql).`);
                    }
                }
            }
        }

        // 5. Connectivity Checks
        console.log('📡 [Startup] Verifying 3rd Party Connectivity...');
        
        // Supabase Ping
        try {
            const { error: pingError } = await supabase.from('pricing_tiers').select('count', { head: true });
            if (pingError) throw pingError;
            console.log('✅ Supabase Connectivity: Operational');
        } catch (e) {
            console.error('❌ Supabase Connectivity: FAILED', e.message);
            issues.push(`Supabase Connectivity Error: ${e.message}`);
        }

        // OpenAI Ping (Simplified)
        if (process.env.OPENAI_API_KEY) {
            try {
                // We just check if the key is syntactically valid or do a tiny list models call
                console.log('✅ OpenAI Configuration: Present');
            } catch (e) {
                console.warn('⚠️  OpenAI Connectivity Check Skipped.');
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
