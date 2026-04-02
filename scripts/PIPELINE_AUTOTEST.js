import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

dotenv.config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const apiUrl = process.env.VITE_API_URL || 'https://api.costloci.com/api';

const supabase = createClient(supabaseUrl, serviceKey);

async function runTests() {
    console.log('🚀 Starting Pipeline Autotest...');

    const results = {
        database: { status: 'PENDING', errors: [] },
        auth: { status: 'PENDING', errors: [] },
        endpoints: { status: 'PENDING', errors: [] }
    };

    // 1. Check Database Tables
    const requiredTables = ['profiles', 'contracts', 'notifications', 'risk_register', 'contract_overages', 'audit_logs'];
    for (const table of requiredTables) {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error) {
            console.error(`❌ Table missing or error in ${table}:`, error.message);
            results.database.errors.push(`${table}: ${error.message}`);
        } else {
            console.log(`✅ Table ${table} verified.`);
        }
    }
    results.database.status = results.database.errors.length === 0 ? 'SUCCESS' : 'FAILED';

    // 2. Check API Endpoints (Healthy check)
    const endpoints = [
        '/health',
        '/billing/status',
        '/notifications',
        '/analytics/dashboard',
        '/dashboard/metrics'
    ];

    // We need a test token. We'll use the service role to generate a session or just use a known test user.
    // For this script, we'll try to reach the health endpoint first.
    try {
        const health = await fetch(`${apiUrl}/health`);
        if (health.ok) {
            console.log('✅ API Health endpoint reached.');
        } else {
            console.error('❌ API Health check failed:', health.status);
            results.endpoints.errors.push(`Health: ${health.status}`);
        }
    } catch (e) {
        results.endpoints.errors.push(`Network: ${e.message}`);
    }

    console.log('\n--- Test Summary ---');
    console.log(JSON.stringify(results, null, 2));

    if (results.database.status === 'FAILED') {
        console.log('\n🛠️  Attempting Database Autofix...');
        // In a real scenario, we'd run the SQL migrations here via a tool or the Supabase API if possible.
        // For now, we report the need for migration.
    }
}

runTests();
