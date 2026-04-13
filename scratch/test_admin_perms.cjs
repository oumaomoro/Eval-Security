const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL || "https://ulercnwyckrcjcnrenzz.supabase.co";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("URL:", url);
console.log("Service Key Length:", serviceKey ? serviceKey.length : "MISSING");

const adminClient = createClient(url, serviceKey);

async function testAdmin() {
    console.log("\n--- TESTING ADMIN CLIENT PERMISSIONS ---");
    const testOrg = {
        name: `ADMIN_TEST_${Date.now()}`,
        slug: `admin-test-${Date.now().toString(36)}`,
        tier: 'free'
    };
    
    console.log("Attempting insert into 'organizations'...");
    const { data, error } = await adminClient.from('organizations').insert([testOrg]).select().single();
    
    if (error) {
        console.error("FAILED:", error.message);
        if (error.message.includes("RLS")) {
            console.log("Confirming: Service Role is being blocked by RLS. This is highly unusual for Supabase.");
        }
    } else {
        console.log("SUCCESS! Admin client can bypass RLS.");
        console.log("Created Org ID:", data.id);
        
        // Cleanup
        await adminClient.from('organizations').delete().eq('id', data.id);
        console.log("Cleanup complete.");
    }
}

testAdmin();
