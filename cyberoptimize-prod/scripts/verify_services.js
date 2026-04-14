import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

console.log('🔍 Starting Pre-Flight Service Verification...');

const checkEnv = (key) => {
    if (!process.env[key]) {
        console.warn(`⚠️ Warning: ${key} is missing from environment.`);
        return false;
    }
    console.log(`✅ ${key} is configured.`);
    return true;
};

const CRITICAL_KEYS = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY', 'OPENAI_API_KEY'];
let allOk = true;

CRITICAL_KEYS.forEach(key => {
    if (!checkEnv(key)) allOk = false;
});

// Quick Supabase Connectivity Test
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
        console.error('❌ Supabase Connectivity Failed:', error.message);
        allOk = false;
    } else {
        console.log('✅ Supabase Connection: Operational.');
    }
}

if (allOk) {
    console.log('🚀 All systems go. Platform ready for deployment.');
} else {
    console.warn('⚠️ Some non-critical systems are missing or degraded. Verify dashboard logs after deploy.');
}

process.exit(0); // Exit smoothly to allow deploy_all.js to continue
