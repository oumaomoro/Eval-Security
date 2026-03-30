import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

const API_URL = 'http://localhost:3001/api';
const SECRET = 'cyberoptimize-secret-2024';

// Simulate a user who has NO contracts in the DB
const testUser = {
    id: 'b75f284e-da2e-4b71-9730-6893e3d93d39', // Random UUID
    email: 'newuser@example.com',
    role: 'user'
};

const token = jwt.sign(testUser, SECRET, { expiresIn: '1h' });

async function testRoute(name, endpoint) {
    console.log(`\n🔍 Testing ${name}...`);
    try {
        const res = await fetch(`${API_URL}${endpoint}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (res.ok) {
            console.log(`✅ ${name} SUCCESS (200 OK)`);
            console.log(`📊 Data:`, JSON.stringify(data.data, null, 2));
        } else {
            console.error(`❌ ${name} FAILED (${res.status})`);
            console.error(`🛑 Error:`, data);
        }
    } catch (err) {
        console.error(`🛑 Network Error in ${name}:`, err.message);
    }
}

async function runTests() {
    console.log('🚀 Starting Dashboard Fix Verification...');
    
    // We expect 200 OK with zeroed out metrics even if the user has no data
    await testRoute('Dashboard Metrics', '/dashboard/metrics');
    await testRoute('Analytics Dashboard', '/analytics/dashboard');
}

runTests();
